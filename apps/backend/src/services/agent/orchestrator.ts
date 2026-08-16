/**
 * Agent Orchestrator
 *
 * LangGraph-based agent for handling creator conversations.
 */

import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { MemoryService } from './memory/index.js';
import { ToolRegistry } from './tools/index.js';
import { gemini } from '../../lib/llm.js';

// Agent state definition
const AgentState = Annotation.Root({
  conversationId: Annotation<string>,
  creatorId: Annotation<string>,
  messages: Annotation<Message[]>,
  context: Annotation<AgentContext>,
  currentPlan: Annotation<Plan | null>,
  toolResults: Annotation<ToolResult[]>,
  response: Annotation<string>,
});

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
}

interface AgentContext {
  creatorState: any;
  relevantMemories: any[];
  youtubeContext: any;
}

interface Plan {
  steps: PlanStep[];
  reasoning: string;
}

interface PlanStep {
  tool: string;
  args: Record<string, any>;
}

interface ToolCall {
  id: string;
  tool: string;
  args: Record<string, any>;
}

interface ToolResult {
  id: string;
  success: boolean;
  data: any;
}

export interface StreamEvent {
  type: 'message_start' | 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  id?: string;
  tool?: string;
  args?: Record<string, any>;
  result?: any;
  error?: string;
  conversationId?: string;
  messageId?: string;
}

interface OrchestratorConfig {
  creatorId: string;
  conversationId?: string;
}

export class AgentOrchestrator {
  private creatorId: string;
  private conversationId: string;
  private memoryService: MemoryService;
  private toolRegistry: ToolRegistry;
  private graph: any;

  constructor(config: OrchestratorConfig) {
    this.creatorId = config.creatorId;
    this.conversationId = config.conversationId || crypto.randomUUID();
    this.memoryService = new MemoryService(this.creatorId);
    this.toolRegistry = new ToolRegistry();
    this.graph = this.buildGraph();
  }

  private buildGraph() {
    // TODO: Build LangGraph state machine
    // Nodes: contextBuilder, classify, plan, execute, respond, persistMemory
    return null;
  }

  async *stream(message: string): AsyncGenerator<StreamEvent> {
    yield {
      type: 'message_start',
      conversationId: this.conversationId,
    };

    try {
      // Try to build context, but don't fail if it errors
      let contextInfo = '';
      try {
        const context = await this.memoryService.retrieveContext(message, { limit: 5 });
        if (context.relevantMemories.length > 0) {
          contextInfo += `Relevant memories:\n${context.relevantMemories.map(m => `- ${m.content}`).join('\n')}\n`;
        }
        if (context.creatorState?.profile) {
          contextInfo += `Creator: ${context.creatorState.profile.displayName || 'Unknown'}\n`;
        }
        if (context.youtubeContext?.channel) {
          contextInfo += `Channel: ${context.youtubeContext.channel.title} (${context.youtubeContext.channel.subscriberCount || 0} subscribers)\n`;
        }
      } catch (contextError) {
        console.warn('Failed to retrieve context, continuing without it:', contextError);
      }

      // Generate response using Gemini
      const systemPrompt = `You are an AI assistant for YouTube creators. You help them manage their channel, content, analytics, sponsorships, and daily workflow. Be helpful, concise, and actionable.

${contextInfo}`;

      const response = await gemini.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ]);

      // Stream the response text
      const text = typeof response.content === 'string'
        ? response.content
        : response.content.map((c: any) => c.text || '').join('');

      // Yield text in chunks for streaming effect
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield {
          type: 'text',
          content: words[i] + (i < words.length - 1 ? ' ' : ''),
        };
        // Small delay for streaming effect
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    } catch (error) {
      console.error('Agent error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    yield {
      type: 'done',
      messageId: crypto.randomUUID(),
    };
  }
}
