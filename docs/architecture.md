# Architecture Documentation

## System Overview

Agentic Creator OS uses a **monorepo architecture** with a separate Node.js backend, keeping Supabase as the data layer only. This provides better scalability, easier debugging, and no timeout limitations.

```
┌─────────────────────────────────────────────────────────────────┐
│                      REACT NATIVE APP                            │
│                        (apps/mobile)                             │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐│
│  │  Chat UI │ │ Dashboard │ │ Calendar │ │Timeline│ │Analytics││
│  └──────────┘ └───────────┘ └──────────┘ └────────┘ └─────────┘│
│  ─────────────────────────────────────────────────────────────  │
│  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐  │
│  │ Zustand (State) │ │ SQLite (Offline) │ │   API Client    │  │
│  └─────────────────┘ └──────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS / WebSocket / SSE
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NODE.JS BACKEND                              │
│                      (apps/backend)                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      API LAYER                               ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           ││
│  │  │  Auth   │ │  Chat   │ │  Tasks  │ │ YouTube │           ││
│  │  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │           ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    SERVICE LAYER                             ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            ││
│  │  │   Agent     │ │   YouTube   │ │  Briefing   │            ││
│  │  │   Service   │ │   Service   │ │  Service    │            ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘            ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            ││
│  │  │   Impact    │ │   Memory    │ │Notification │            ││
│  │  │   Service   │ │   Service   │ │  Service    │            ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘            ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 BACKGROUND JOBS (BullMQ)                     ││
│  │  youtube-sync │ briefing │ impact-score │ notification      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Supabase   │ │    Redis    │ │  OpenAI /   │ │  YouTube    │
│  Postgres   │ │   (Upstash) │ │  Anthropic  │ │    API      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Monorepo Structure

```
agentic-creator-os/
├── apps/
│   ├── backend/                # Node.js API server
│   └── mobile/                 # React Native app
├── packages/
│   ├── shared-types/           # Common TypeScript types
│   ├── api-client/             # Type-safe API client
│   └── config/                 # Shared configuration
├── supabase/
│   └── migrations/             # Database schema
├── turbo.json                  # Turborepo config
└── pnpm-workspace.yaml         # pnpm workspaces
```

---

## Backend Architecture

### Layer Overview

```
apps/backend/src/
├── api/                    # Route handlers (Fastify)
│   ├── auth/              # Authentication endpoints
│   ├── chat/              # SSE streaming + WebSocket
│   ├── tasks/             # Task CRUD
│   ├── content/           # Ideas, pipeline, sponsorships
│   ├── youtube/           # YouTube data endpoints
│   └── webhooks/          # External webhooks
├── services/              # Business logic
│   ├── agent/             # LangGraph orchestrator
│   │   ├── orchestrator.ts
│   │   ├── tools/         # Agent tools
│   │   ├── memory/        # Memory system
│   │   └── prompts/       # System prompts
│   ├── youtube/           # YouTube API integration
│   ├── briefing/          # Daily briefing generator
│   ├── impact/            # Impact score calculator
│   └── notification/      # Push notifications
├── jobs/                  # BullMQ background workers
├── lib/                   # Infrastructure
│   ├── database.ts        # Drizzle + PostgreSQL
│   ├── redis.ts           # Redis connection
│   ├── queue.ts           # BullMQ queues
│   ├── llm.ts             # Claude + OpenAI clients
│   └── env.ts             # Environment validation
├── middleware/            # Request middleware
│   ├── auth.ts            # JWT verification
│   ├── errorHandler.ts    # Global error handling
│   └── requestLogger.ts   # Request logging
├── db/                    # Database
│   └── schema.ts          # Drizzle schema
├── server.ts              # API server entry point
└── worker.ts              # Background worker entry point
```

### Request Flow

```
Client Request
      │
      ▼
┌─────────────┐
│   Fastify   │
│   Server    │
└─────────────┘
      │
      ├──▶ Middleware (auth, logging, rate limit)
      │
      ▼
┌─────────────┐
│    Route    │
│   Handler   │
└─────────────┘
      │
      ▼
┌─────────────┐
│   Service   │
│    Layer    │
└─────────────┘
      │
      ├──▶ Database (Drizzle)
      ├──▶ Redis (cache)
      ├──▶ LLM (Claude/OpenAI)
      │
      ▼
   Response
```

---

## Mobile App Architecture

### Layer Overview

```
apps/mobile/
├── app/                        # Expo Router (file-based)
│   ├── (auth)/                # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (main)/                # Main tab navigator
│   │   ├── chat/
│   │   ├── dashboard/
│   │   ├── calendar/
│   │   ├── timeline/
│   │   └── settings/
│   ├── (modals)/              # Modal screens
│   └── _layout.tsx            # Root layout
├── src/
│   ├── features/              # Feature modules
│   │   ├── chat/
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   └── content/
│   ├── services/              # API clients
│   │   ├── supabase.ts        # Auth only
│   │   └── api.ts             # Backend API
│   ├── store/                 # Zustand stores
│   └── offline/               # SQLite + sync
```

### State Management

```typescript
// Zustand stores
useAuthStore      // Authentication state
useCreatorStore   // Creator profile, preferences
useConversationStore // Chat messages
useTasksStore     // Task list
useBriefingStore  // Daily briefing
useUIStore        // UI state (modals, loading)
```

---

## Agent System

### LangGraph Flow

```
USER MESSAGE
      │
      ▼
┌─────────────────────┐
│   CONTEXT BUILDER   │  ← Load memories, creator state, YouTube data
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│      CLASSIFY       │  ← Determine intent and entities
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│        PLAN         │  ← Select tools and order operations
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│      EXECUTE        │  ← Run tools, stream results
│   (Tool Loop)       │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│      RESPOND        │  ← Generate natural language response
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│   PERSIST MEMORY    │  ← Extract facts, update memories
└─────────────────────┘
```

### Available Tools

| Category | Tools |
|----------|-------|
| Tasks | `createTask`, `listTasks`, `updateTask` |
| Analytics | `getVideoPerformance`, `getChannelStats` |
| Content | `generateIdeas`, `listIdeas`, `getPipeline` |
| Impact | `calculateImpact`, `getRecommendation` |
| Memory | `saveMemory`, `queryMemory` |

### Three-Tier Memory

```
┌─────────────────────────────────────────┐
│              MEMORY MANAGER              │
└─────────────────────────────────────────┘
         │           │           │
         ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ EPISODIC  │ │ SEMANTIC  │ │PROCEDURAL │
│           │ │           │ │           │
│ Recent    │ │ Knowledge │ │ Workflows │
│ messages  │ │ + vectors │ │ + patterns│
│ (last 10) │ │ (pgvector)│ │           │
└───────────┘ └───────────┘ └───────────┘
```

---

## Background Jobs

### BullMQ Workers

| Queue | Schedule | Description |
|-------|----------|-------------|
| `youtube-sync` | Daily 3 AM | Sync YouTube data |
| `briefing` | Daily 6 AM | Generate daily briefings |
| `impact-score` | Daily 5 AM | Calculate impact scores |
| `notification` | On-demand | Send push notifications |

### Job Flow

```typescript
// Queue definition (apps/backend/src/lib/queue.ts)
export const youtubeSyncQueue = new Queue('youtube-sync', { connection: redis });

// Worker (apps/backend/src/jobs/index.ts)
new Worker('youtube-sync', async (job) => {
  const service = new YouTubeService(job.data.creatorId);
  await service.sync();
}, { connection: redis });

// Scheduling
await youtubeSyncQueue.upsertJobScheduler(
  'daily-sync',
  { pattern: '0 3 * * *' },  // Cron: 3 AM daily
  { name: 'sync-all', data: {} }
);
```

---

## Data Flow

### Chat Message Flow

```
Mobile App                    Backend                      External
    │                            │                            │
    │  POST /api/chat/stream     │                            │
    │ ─────────────────────────▶ │                            │
    │                            │                            │
    │                            │  Build context             │
    │                            │  (DB + Redis)              │
    │                            │                            │
    │                            │  LLM Request ────────────▶ │
    │                            │ ◀──────────── Response     │
    │                            │                            │
    │  SSE: tool_call            │                            │
    │ ◀───────────────────────── │                            │
    │                            │  Execute tool              │
    │                            │  (DB mutation)             │
    │  SSE: tool_result          │                            │
    │ ◀───────────────────────── │                            │
    │                            │                            │
    │  SSE: text (streaming)     │                            │
    │ ◀───────────────────────── │                            │
    │                            │                            │
    │  SSE: done                 │                            │
    │ ◀───────────────────────── │                            │
    │                            │  Persist memory            │
```

### Offline Sync Flow

```
┌────────────────────────────────────────────────────┐
│                   ONLINE MODE                       │
│  User Action → API Call → DB Update → UI Update    │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│                  OFFLINE MODE                       │
│  User Action → SQLite Queue → UI Update (optimistic)│
└────────────────────────────────────────────────────┘
                         │
            Connection Restored
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│                   SYNC ENGINE                       │
│  1. Get pending changes from SQLite                 │
│  2. POST to Backend API                             │
│  3. Handle conflicts (last-write-wins)              │
│  4. Mark synced in SQLite                           │
└────────────────────────────────────────────────────┘
```

---

## Security

### Authentication Flow

```
Mobile App          Supabase Auth          Backend
    │                    │                    │
    │  Sign in           │                    │
    │ ─────────────────▶ │                    │
    │                    │                    │
    │  JWT Token         │                    │
    │ ◀───────────────── │                    │
    │                    │                    │
    │  API Request + JWT                      │
    │ ───────────────────────────────────────▶│
    │                    │                    │
    │                    │  Verify JWT        │
    │                    │ ◀───────────────── │
    │                    │                    │
    │                    │  User claims       │
    │                    │ ─────────────────▶ │
    │                    │                    │
    │  Response                               │
    │ ◀───────────────────────────────────────│
```

### Security Measures

| Layer | Measure |
|-------|---------|
| Transport | HTTPS everywhere |
| Auth | JWT with short expiry, refresh tokens |
| Database | Row-Level Security (RLS) |
| API | Rate limiting, input validation (Zod) |
| Secrets | Environment variables, never in code |

---

## Scalability

### Horizontal Scaling

```
                    Load Balancer
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Backend  │    │ Backend  │    │ Backend  │
   │ Instance │    │ Instance │    │ Instance │
   └──────────┘    └──────────┘    └──────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌──────────┐          ┌──────────┐
        │  Redis   │          │ Postgres │
        │ (Upstash)│          │(Supabase)│
        └──────────┘          └──────────┘
```

### Worker Scaling

```
              Redis Queue
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌────────┐    ┌────────┐    ┌────────┐
│ Worker │    │ Worker │    │ Worker │
│   1    │    │   2    │    │   3    │
└────────┘    └────────┘    └────────┘
```

---

## Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend Framework | Fastify | Fast, TypeScript-first, great plugin system |
| ORM | Drizzle | Type-safe, lightweight, good DX |
| Queue | BullMQ | Reliable, Redis-based, great UI (Bull Board) |
| Agent | LangGraph | Stateful workflows, tool calling, streaming |
| LLM | Google Gemini | 1.5 Pro (reasoning), Flash (fast), Embeddings |
| Database | Supabase Postgres | Managed, pgvector support, RLS |
| Cache | Redis (Upstash) | Serverless, pay-per-request |
| Monorepo | Turborepo + pnpm | Fast builds, workspace protocol |
