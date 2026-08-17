/**
 * Agent Orchestrator
 *
 * LangGraph-based agent for handling creator conversations.
 *
 * Graph: contextBuilder -> classify -> [plan -> executeTools ->] respond -> persistMemory -> END
 * The plan/executeTools nodes are skipped entirely when classify() decides
 * the message doesn't need any tool calls.
 */

import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { MemoryService, type AgentContext } from './memory/index.js';
import { ToolRegistry, type ToolResult } from './tools/index.js';
import { gemini } from '../../lib/llm.js';
import { classifyIntent, type ClassificationResult } from './classifier.js';
import { planActions, type Plan } from './planner.js';
import { SYSTEM_PROMPT, MEMORY_EXTRACTION_PROMPT } from './prompts/index.js';

const AgentState = Annotation.Root({
  creatorId: Annotation<string>,
  conversationId: Annotation<string>,
  message: Annotation<string>,
  context: Annotation<AgentContext | null>({ reducer: (_, next) => next, default: () => null }),
  classification: Annotation<ClassificationResult | null>({ reducer: (_, next) => next, default: () => null }),
  plan: Annotation<Plan | null>({ reducer: (_, next) => next, default: () => null }),
  toolResults: Annotation<{ tool: string; result: ToolResult }[]>({ reducer: (_, next) => next, default: () => [] }),
  response: Annotation<string>({ reducer: (_, next) => next, default: () => '' }),
});

type State = typeof AgentState.State;

export interface StreamEvent {
  type: 'message_start' | 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  toolResult?: any;
  error?: string;
  conversationId?: string;
  messageId?: string;
}

interface OrchestratorConfig {
  creatorId: string;
  conversationId?: string;
}

function summarizeContext(context: AgentContext | null): string {
  if (!context) return 'No context available.';
  const lines: string[] = [];

  if (context.creatorState?.profile) {
    lines.push(`Creator: ${context.creatorState.profile.displayName ?? 'Unknown'}`);
  }
  if (context.creatorState?.goals?.length) {
    lines.push(`Goals: ${context.creatorState.goals.map((g: any) => g.title).join(', ')}`);
  }
  if (context.creatorState?.preferences?.length) {
    lines.push(
      `Preferences: ${context.creatorState.preferences.map((p: any) => `${p.key}=${p.value}`).join(', ')}`
    );
  }
  if (context.youtubeContext?.channel) {
    lines.push(
      `Channel: ${context.youtubeContext.channel.title} (${context.youtubeContext.channel.subscriberCount ?? 0} subscribers)`
    );
  }
  if (context.relevantMemories?.length) {
    lines.push(`Relevant memories:\n${context.relevantMemories.map((m: any) => `- ${m.content}`).join('\n')}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'No prior context available.';
}

export class AgentOrchestrator {
  private creatorId: string;
  private conversationId: string;
  private memoryService: MemoryService;
  private toolRegistry: ToolRegistry;
  private graph: ReturnType<typeof AgentOrchestrator.prototype.buildGraph>;

  constructor(config: OrchestratorConfig) {
    this.creatorId = config.creatorId;
    this.conversationId = config.conversationId || crypto.randomUUID();
    this.memoryService = new MemoryService(this.creatorId);
    this.toolRegistry = new ToolRegistry();
    this.graph = this.buildGraph();
  }

  private buildGraph() {
    const contextBuilder = async (state: State): Promise<Partial<State>> => {
      try {
        const context = await this.memoryService.retrieveContext(state.message, { limit: 5 });
        return { context };
      } catch (error) {
        console.warn('contextBuilder failed, continuing without context:', error);
        return { context: null };
      }
    };

    const classify = async (state: State): Promise<Partial<State>> => {
      const toolNames = this.toolRegistry.getAll().map((t) => t.name);
      const classification = await classifyIntent(state.message, toolNames);
      return { classification };
    };

    const plan = async (state: State): Promise<Partial<State>> => {
      const contextSummary = summarizeContext(state.context);
      const generatedPlan = await planActions(
        state.message,
        state.classification?.intent ?? 'general',
        this.toolRegistry.getAll(),
        contextSummary
      );
      return { plan: generatedPlan };
    };

    const executeTools = async (state: State): Promise<Partial<State>> => {
      const steps = state.plan?.steps ?? [];
      const results: { tool: string; result: ToolResult }[] = [];

      for (const step of steps) {
        const result = await this.toolRegistry.execute(step.tool, step.args, {
          creatorId: this.creatorId,
          conversationId: this.conversationId,
        });
        results.push({ tool: step.tool, result });
      }

      return { toolResults: results };
    };

    const respond = async (state: State): Promise<Partial<State>> => {
      const contextSummary = summarizeContext(state.context);
      const toolResultsSummary =
        state.toolResults.length > 0
          ? `\n\nTool results:\n${state.toolResults
              .map((r) => `- ${r.tool}: ${r.result.success ? JSON.stringify(r.result.data) : `error: ${r.result.error}`}`)
              .join('\n')}`
          : '';

      const systemPrompt = `${SYSTEM_PROMPT}\n\n## Context\n${contextSummary}${toolResultsSummary}`;

      const response = await gemini.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: state.message },
      ]);

      const text =
        typeof response.content === 'string'
          ? response.content
          : response.content.map((c: any) => c.text || '').join('');

      return { response: text };
    };

    const persistMemory = async (state: State): Promise<Partial<State>> => {
      // Fire-and-forget: don't hold up the response for memory extraction.
      void this.extractAndSaveMemory(state.message, state.response).catch((error) => {
        console.warn('persistMemory failed:', error);
      });
      return {};
    };

    const graph = new StateGraph(AgentState)
      .addNode('contextBuilder', contextBuilder)
      .addNode('classify', classify)
      .addNode('planSteps', plan)
      .addNode('executeTools', executeTools)
      .addNode('respond', respond)
      .addNode('persistMemory', persistMemory)
      .addEdge(START, 'contextBuilder')
      .addEdge('contextBuilder', 'classify')
      .addConditionalEdges(
        'classify',
        (state: State) => (state.classification?.needsTools ? 'planSteps' : 'respond'),
        { planSteps: 'planSteps', respond: 'respond' }
      )
      .addEdge('planSteps', 'executeTools')
      .addEdge('executeTools', 'respond')
      .addEdge('respond', 'persistMemory')
      .addEdge('persistMemory', END);

    return graph.compile();
  }

  private async extractAndSaveMemory(userMessage: string, assistantResponse: string): Promise<void> {
    const prompt = `${MEMORY_EXTRACTION_PROMPT}

Conversation:
User: ${userMessage}
Assistant: ${assistantResponse}`;

    const response = await gemini.invoke(prompt);
    const text = typeof response.content === 'string' ? response.content : String(response.content);

    let parsed: { memories?: { content: string; type?: string }[]; preferences?: { key: string; value: string; confidence?: number }[] } = {};
    try {
      const cleaned = text.trim().replace(/^```json\s*|^```\s*|\s*```$/g, '');
      parsed = JSON.parse(cleaned);
    } catch {
      return;
    }

    for (const memory of parsed.memories ?? []) {
      if (!memory.content) continue;
      await this.memoryService.saveMemory(memory.content, (memory.type as any) ?? 'episodic');
    }

    for (const pref of parsed.preferences ?? []) {
      if (!pref.key || !pref.value) continue;
      await this.memoryService.updateCreatorMemory(pref.key, pref.value, pref.confidence ?? 0.7);
    }
  }

  /**
   * Run the full graph, then stream the result back as SSE-shaped events:
   * tool_call/tool_result for each executed step, then the response text
   * in word chunks, then done.
   */
  async *stream(message: string): AsyncGenerator<StreamEvent> {
    yield { type: 'message_start', conversationId: this.conversationId };

    try {
      const finalState = await this.graph.invoke({
        creatorId: this.creatorId,
        conversationId: this.conversationId,
        message,
      });

      const steps = finalState.plan?.steps ?? [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step) continue;
        const entry = finalState.toolResults[i];

        yield { type: 'tool_call', toolName: step.tool, toolArgs: step.args };

        if (entry) {
          yield {
            type: 'tool_result',
            toolName: entry.tool,
            toolResult: entry.result.success ? entry.result.data : { error: entry.result.error },
          };
        }
      }

      const text = finalState.response || "I couldn't generate a response — please try again.";
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield { type: 'text', content: words[i] + (i < words.length - 1 ? ' ' : '') };
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (error) {
      console.error('Agent error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    yield { type: 'done', messageId: crypto.randomUUID() };
  }

  /**
   * Non-streaming variant used by workflow-triggered runs and tests.
   */
  async run(message: string): Promise<{ response: string; toolResults: { tool: string; result: ToolResult }[] }> {
    const finalState = await this.graph.invoke({
      creatorId: this.creatorId,
      conversationId: this.conversationId,
      message,
    });
    return { response: finalState.response, toolResults: finalState.toolResults };
  }
}
