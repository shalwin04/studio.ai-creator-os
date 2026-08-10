/**
 * useAgentStream Hook
 *
 * Handles SSE streaming communication with the agent backend.
 * Provides real-time message streaming, tool call visualization,
 * and conversation management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

// ============================================
// TYPES
// ============================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  isStreaming?: boolean;
  createdAt: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
}

export interface StreamEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';
  data: any;
}

export interface UseAgentStreamOptions {
  conversationId?: string;
  onMessage?: (message: Message) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onError?: (error: Error) => void;
}

export interface UseAgentStreamReturn {
  messages: Message[];
  isStreaming: boolean;
  isConnected: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useAgentStream(options: UseAgentStreamOptions = {}): UseAgentStreamReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const conversationIdRef = useRef(options.conversationId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');

  // Update conversation ID ref when it changes
  useEffect(() => {
    conversationIdRef.current = options.conversationId;
  }, [options.conversationId]);

  /**
   * Parse SSE event data
   */
  const parseSSEEvent = useCallback((eventString: string): StreamEvent | null => {
    try {
      const lines = eventString.split('\n');
      let eventType = 'text';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          data = line.slice(5).trim();
        }
      }

      if (!data) return null;

      return {
        type: eventType as StreamEvent['type'],
        data: data === '[DONE]' ? null : JSON.parse(data),
      };
    } catch {
      return null;
    }
  }, []);

  /**
   * Process incoming stream events
   */
  const processStreamEvent = useCallback((
    event: StreamEvent,
    currentMessage: Message
  ): Message => {
    switch (event.type) {
      case 'text':
        return {
          ...currentMessage,
          content: currentMessage.content + (event.data?.content || ''),
        };

      case 'tool_call':
        const newToolCall: ToolCall = {
          id: event.data.id,
          name: event.data.name,
          arguments: event.data.arguments,
          status: 'pending',
        };
        return {
          ...currentMessage,
          toolCalls: [...(currentMessage.toolCalls || []), newToolCall],
        };

      case 'tool_result':
        return {
          ...currentMessage,
          toolCalls: currentMessage.toolCalls?.map(tc =>
            tc.id === event.data.tool_call_id
              ? {
                  ...tc,
                  status: event.data.error ? 'error' : 'completed',
                  result: event.data.result,
                  error: event.data.error,
                }
              : tc
          ),
        };

      case 'error':
        setError(new Error(event.data?.message || 'Stream error'));
        return currentMessage;

      case 'done':
        return {
          ...currentMessage,
          isStreaming: false,
        };

      default:
        return currentMessage;
    }
  }, []);

  /**
   * Send a message to the agent
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    lastUserMessageRef.current = content;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);

    // Create placeholder for assistant response
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      toolCalls: [],
      isStreaming: true,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get Supabase function URL
      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/agent`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: content,
          conversationId: conversationIdRef.current,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setIsConnected(true);

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentMessage = assistantMessage;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split buffer into events (separated by double newlines)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const eventString of events) {
          if (!eventString.trim()) continue;

          const event = parseSSEEvent(eventString);
          if (!event) continue;

          currentMessage = processStreamEvent(event, currentMessage);

          // Update messages state
          setMessages(prev =>
            prev.map(m => (m.id === currentMessage.id ? currentMessage : m))
          );

          // Notify via callback
          if (event.type === 'tool_call' && options.onToolCall) {
            const latestToolCall = currentMessage.toolCalls?.[currentMessage.toolCalls.length - 1];
            if (latestToolCall) {
              options.onToolCall(latestToolCall);
            }
          }
        }
      }

      // Finalize message
      currentMessage = {
        ...currentMessage,
        isStreaming: false,
      };

      setMessages(prev =>
        prev.map(m => (m.id === currentMessage.id ? currentMessage : m))
      );

      if (options.onMessage) {
        options.onMessage(currentMessage);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stream was intentionally cancelled
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      if (options.onError) {
        options.onError(error);
      }

      // Update assistant message to show error
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: 'Sorry, there was an error processing your message. Please try again.',
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [isStreaming, options, parseSSEEvent, processStreamEvent]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    // Cancel any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Retry the last user message
   */
  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    // Remove the last assistant message (error response)
    setMessages(prev => {
      const lastUserIndex = prev.findLastIndex(m => m.role === 'user');
      if (lastUserIndex === -1) return prev;
      return prev.slice(0, lastUserIndex);
    });

    await sendMessage(lastUserMessageRef.current);
  }, [sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    isConnected,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}

export default useAgentStream;
