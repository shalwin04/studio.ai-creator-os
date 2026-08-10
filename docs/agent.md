# Agent System Documentation

## Overview

The Agentic Creator OS agent is built on **LangGraph** with **Google Gemini**, providing stateful, multi-step reasoning with tool execution and memory persistence. The agent lives in `apps/backend/src/services/agent/`.

### LLM Models Used

| Model | Purpose |
|-------|---------|
| `gemini-1.5-pro` | Main reasoning, complex tasks |
| `gemini-1.5-flash` | Fast operations, classification |
| `text-embedding-004` | Vector embeddings for memory |

---

## Architecture

```
apps/backend/src/services/agent/
├── orchestrator.ts     # LangGraph state machine
├── tools/
│   └── index.ts       # Tool registry and definitions
├── memory/
│   └── index.ts       # Three-tier memory system
└── prompts/
    └── index.ts       # System prompts
```

---

## Orchestrator

The orchestrator manages the agent's execution flow using LangGraph's state machine.

### State Definition

```typescript
// apps/backend/src/services/agent/orchestrator.ts

interface AgentState {
  conversationId: string;
  creatorId: string;
  messages: Message[];
  context: AgentContext;
  currentPlan: Plan | null;
  toolResults: ToolResult[];
  response: string;
}

interface AgentContext {
  creatorState: any;
  relevantMemories: Memory[];
  youtubeContext: any;
  conversationHistory: Message[];
}
```

### Flow

```
USER MESSAGE
      │
      ▼
┌─────────────────────┐
│   CONTEXT BUILDER   │
│                     │
│  • Load memories    │
│  • Get creator state│
│  • Fetch YT context │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│      CLASSIFY       │
│                     │
│  • Intent detection │
│  • Entity extraction│
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│        PLAN         │
│                     │
│  • Select tools     │
│  • Order operations │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│      EXECUTE        │
│                     │
│  • Run tools        │
│  • Stream results   │
│  (loops until done) │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│      RESPOND        │
│                     │
│  • Generate text    │
│  • Stream to client │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│   PERSIST MEMORY    │
│                     │
│  • Extract facts    │
│  • Update memories  │
└─────────────────────┘
```

### Streaming

The orchestrator yields events as it processes:

```typescript
// apps/backend/src/services/agent/orchestrator.ts

export class AgentOrchestrator {
  async *stream(message: string): AsyncGenerator<StreamEvent> {
    yield { type: 'message_start', conversationId: this.conversationId };

    // Build context
    const context = await this.memoryService.retrieveContext(message);

    // Execute tools
    for (const step of plan.steps) {
      yield { type: 'tool_call', tool: step.tool, args: step.args };

      const result = await this.toolRegistry.execute(step.tool, step.args);

      yield { type: 'tool_result', result };
    }

    // Generate response
    for await (const chunk of this.generateResponse()) {
      yield { type: 'text', content: chunk };
    }

    yield { type: 'done', messageId: newMessageId };
  }
}
```

---

## Tool System

### Tool Registry

```typescript
// apps/backend/src/services/agent/tools/index.ts

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>, context: ToolContext) => Promise<ToolResult>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  getAll(): Tool[];

  async execute(
    name: string,
    args: Record<string, any>,
    context: ToolContext
  ): Promise<ToolResult>;
}
```

### Available Tools

| Category | Tool | Description |
|----------|------|-------------|
| **Tasks** | `createTask` | Create a new task |
| | `listTasks` | List tasks with filters |
| | `updateTask` | Update task status/details |
| **Analytics** | `getVideoPerformance` | Get video metrics |
| | `getChannelStats` | Get channel statistics |
| **Content** | `generateIdeas` | AI-generate video ideas |
| | `listIdeas` | List content ideas |
| | `getPipeline` | Get content pipeline |
| **Impact** | `calculateImpact` | Calculate impact scores |
| | `getRecommendation` | Get top recommendation |
| **Memory** | `saveMemory` | Save to creator memory |
| | `queryMemory` | Search memories |

### Tool Definition Example

```typescript
const createTask: Tool = {
  name: 'createTask',
  description: 'Create a new task for the creator',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string', description: 'Task description' },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent']
      },
      dueDate: { type: 'string', format: 'date-time' },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['title'],
  },
  execute: async (args, context) => {
    const db = getDb();

    const [task] = await db
      .insert(tasks)
      .values({
        creatorId: context.creatorId,
        title: args.title,
        description: args.description,
        priority: args.priority || 'medium',
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
        tags: args.tags || [],
        status: 'pending',
      })
      .returning();

    return { success: true, data: task };
  },
};
```

---

## Memory System

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────┐
│                  MEMORY MANAGER                      │
│         apps/backend/src/services/agent/memory/      │
└─────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  EPISODIC   │ │  SEMANTIC   │ │ PROCEDURAL  │
│             │ │             │ │             │
│  Recent     │ │  Knowledge  │ │  Workflows  │
│  messages   │ │  + vectors  │ │  + patterns │
│  (last 10)  │ │  (pgvector) │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Memory Service

```typescript
// apps/backend/src/services/agent/memory/index.ts

export class MemoryService {
  constructor(private creatorId: string) {}

  // Retrieve all relevant context
  async retrieveContext(
    message: string,
    options?: RetrievalOptions
  ): Promise<AgentContext>;

  // Save new memory with embedding
  async saveMemory(
    content: string,
    type: 'episodic' | 'semantic' | 'procedural',
    metadata?: Record<string, any>
  ): Promise<void>;

  // Vector similarity search
  async searchMemories(
    query: string,
    limit?: number
  ): Promise<Memory[]>;

  // Update creator preferences
  async updateCreatorMemory(
    key: string,
    value: string,
    confidence: number
  ): Promise<void>;
}
```

### Vector Search

```typescript
async searchMemories(query: string, limit: number = 5): Promise<Memory[]> {
  const queryEmbedding = await generateEmbedding(query);

  // pgvector cosine similarity search
  const results = await db.execute(sql`
    SELECT
      id,
      content,
      memory_type,
      metadata,
      1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM agent_memory
    WHERE creator_id = ${this.creatorId}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `);

  return results;
}
```

---

## Prompts

### System Prompt Structure

```typescript
// apps/backend/src/services/agent/prompts/index.ts

export const SYSTEM_PROMPT = `You are an AI assistant for a YouTube creator...`;

export const CLASSIFY_PROMPT = `Analyze the user's message and determine intent...`;

export const PLAN_PROMPT = `Create an execution plan based on intent and tools...`;

export const RESPOND_PROMPT = `Generate a helpful response based on tool results...`;

export const MEMORY_EXTRACTION_PROMPT = `Extract important information to remember...`;

export function buildSystemPrompt(context: {
  creator: any;
  channel: any;
  goals: any[];
  preferences: any[];
}): string {
  return `${SYSTEM_PROMPT}

## Creator Context
- Name: ${context.creator?.displayName || 'Unknown'}
- Channel: ${context.channel?.title || 'Not connected'}
- Subscribers: ${context.channel?.subscriberCount || 0}

## Active Goals
${context.goals?.map((g) => `- ${g.title}`).join('\n') || 'No active goals'}

## Known Preferences
${context.preferences?.map((p) => `- ${p.key}: ${p.value}`).join('\n') || 'None'}`;
}
```

---

## Impact Scoring

### Algorithm

```typescript
// apps/backend/src/services/impact/index.ts

const WEIGHTS = {
  urgency: 0.25,      // Deadline proximity
  revenue: 0.20,      // Revenue potential
  audience: 0.20,     // Audience impact
  goalAlignment: 0.15, // Goal alignment
  effort: 0.10,       // Inverse effort
  momentum: 0.10,     // Recent success
};

function calculateImpactScore(entity: Entity, context: Context): ImpactScore {
  const breakdown = {
    urgency: calculateUrgency(entity),
    revenue: calculateRevenue(entity),
    audience: calculateAudience(entity, context),
    goalAlignment: calculateGoalAlignment(entity, context.goals),
    effort: calculateEffort(entity),
    momentum: calculateMomentum(entity, context),
  };

  const totalScore = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + breakdown[key] * weight * 100,
    0
  );

  return { totalScore, breakdown, reasoning: '...' };
}
```

### Score Calculations

```typescript
function calculateUrgency(entity: Entity): number {
  if (!entity.dueDate) return 0.3;

  const hoursUntilDue = differenceInHours(entity.dueDate, new Date());

  if (hoursUntilDue < 0) return 1.0;      // Overdue
  if (hoursUntilDue < 24) return 0.95;    // Due today
  if (hoursUntilDue < 72) return 0.8;     // 3 days
  if (hoursUntilDue < 168) return 0.6;    // 1 week
  return 0.3;
}

function calculateRevenue(entity: Entity): number {
  if (entity.type === 'sponsorship') {
    const value = entity.dealValue;
    if (value >= 10000) return 1.0;
    if (value >= 5000) return 0.8;
    if (value >= 1000) return 0.6;
    return 0.4;
  }
  return 0.2;
}
```

---

## Integration

### API Route

```typescript
// apps/backend/src/api/chat/index.ts

fastify.post('/stream', async (request, reply) => {
  const { message, conversationId } = request.body;
  const creatorId = request.user.creatorId;

  // SSE headers
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const agent = new AgentOrchestrator({ creatorId, conversationId });

  for await (const event of agent.stream(message)) {
    reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  reply.raw.end();
});
```

### Client Usage

```typescript
// Mobile app
async function* streamChat(message: string) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6));
      }
    }
  }
}
```

---

## Testing

```typescript
// apps/backend/src/services/agent/__tests__/orchestrator.test.ts

describe('AgentOrchestrator', () => {
  it('should handle task creation request', async () => {
    const agent = new AgentOrchestrator({
      creatorId: 'test-creator',
    });

    const events = [];
    for await (const event of agent.stream('Create a task to edit my video')) {
      events.push(event);
    }

    expect(events.some(e => e.type === 'tool_call' && e.tool === 'createTask')).toBe(true);
    expect(events.some(e => e.type === 'done')).toBe(true);
  });
});
```

---

## Extending

### Adding a New Tool

1. Define tool in `apps/backend/src/services/agent/tools/index.ts`:

```typescript
const myNewTool: Tool = {
  name: 'myNewTool',
  description: 'Does something useful',
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string' },
    },
    required: ['param1'],
  },
  execute: async (args, context) => {
    // Implementation
    return { success: true, data: result };
  },
};
```

2. Register in `ToolRegistry` constructor:

```typescript
private registerDefaultTools() {
  // ... existing tools
  this.register(myNewTool);
}
```

3. The agent will automatically discover and use the new tool based on its description.
