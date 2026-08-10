# Agentic Creator OS

AI-powered operating system for YouTube creators with a chat-first interface.

## Architecture

**Monorepo** using pnpm workspaces + Turborepo:
- `apps/mobile` - React Native + Expo mobile app
- `apps/backend` - Node.js + Fastify API server
- `packages/shared-types` - Shared TypeScript types
- `packages/api-client` - Type-safe API client

**Backend** handles all business logic:
- Agent orchestration (LangGraph + Gemini)
- Background jobs (BullMQ + Redis)
- YouTube sync, Briefing, Impact scoring

**Database**: Supabase PostgreSQL + pgvector (or local Docker for dev)

## Build & Run Commands

```bash
# Install dependencies
pnpm install

# Development (all apps)
pnpm dev

# Individual apps
pnpm dev:backend        # Backend API
pnpm dev:mobile         # Mobile app

# Backend with local DB/Redis
cd apps/backend
docker-compose up -d db redis   # Start infrastructure
pnpm dev                         # Start API

# Build
pnpm build
```

## Database Options

**Local Development** (recommended):
```bash
cd apps/backend
docker-compose up -d db redis
# Uses: postgresql://postgres:postgres@localhost:5432/agentic_creator
```

**Cloud (Supabase)**:
```bash
# Set DATABASE_URL to your Supabase connection string
# No Docker needed
```

## Key Directories

```
/apps
  /backend                  # Node.js API (Fastify)
    /src
      /api                  # Route handlers
      /services/agent       # LangGraph + Gemini
      /jobs                 # BullMQ workers
      /lib                  # Database, Redis, LLM
      /db/schema.ts         # Drizzle ORM schema
  /mobile                   # React Native (Expo)
    /app                    # Expo Router screens
    /src                    # Features, services, store
```

## Environment Variables

### Backend (`apps/backend/.env`)
```bash
# Database (choose one)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentic_creator  # Docker
# DATABASE_URL=postgresql://...@db.xxx.supabase.co:5432/postgres            # Supabase

# Redis
REDIS_URL=redis://localhost:6379           # Docker
# REDIS_URL=rediss://...@xxx.upstash.io    # Upstash

# Auth
JWT_SECRET=your-32-char-secret
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# LLM
GOOGLE_API_KEY=AIza...

# YouTube
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxx
```

## Agent System

Uses **LangGraph** with **Google Gemini**:
- `gemini-1.5-pro` - Main reasoning model
- `gemini-1.5-flash` - Fast operations
- `text-embedding-004` - Vector embeddings

Located in `apps/backend/src/services/agent/`

## API Endpoints

- `POST /api/chat/stream` - SSE streaming chat
- `GET /api/chat/ws` - WebSocket chat
- `GET/POST /api/tasks` - Task CRUD
- `GET/POST /api/content/ideas` - Content ideas
- `GET /api/youtube/*` - YouTube data
- `POST /api/youtube/sync` - Trigger sync

## Background Jobs

BullMQ workers (run via `pnpm start:worker`):
- `youtube-sync` - Daily at 3 AM UTC
- `briefing` - Daily at 6 AM UTC
- `impact-score` - Daily at 5 AM UTC
