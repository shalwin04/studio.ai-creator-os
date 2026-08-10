# Agentic Creator OS

An AI-powered operating system for YouTube creators that transforms how creators manage their business through intelligent, conversational automation.

## The Problem

YouTube creators juggle dozens of responsibilities: content planning, video production, analytics monitoring, sponsor negotiations, community management, and business operations. Traditional tools force creators to context-switch between apps, manually check dashboards, and remember deadlines.

## The Solution

Agentic Creator OS provides a **chat-first interface** powered by an AI agent that:

- **Understands your entire creator business** - videos, analytics, sponsors, tasks, goals
- **Proactively recommends what to do next** - not just "what task?" but "what's the highest-impact action right now?"
- **Remembers everything** - your preferences, patterns, and past decisions
- **Automates workflows** - from content ideation to deadline tracking

## Key Features

### Intelligent Chat Interface
Natural language interaction with an AI that has full context of your creator business. Ask questions, give commands, or just chat about your content strategy.

### Highest-Impact Next Action
Proprietary algorithm that analyzes all pending work and surfaces what matters most:
- Urgency-weighted deadline tracking
- Revenue impact estimation
- Audience growth potential
- Goal alignment scoring

### Creator Memory
Three-tier memory system that learns and adapts:
- **Episodic**: Recent conversations and decisions
- **Semantic**: Your preferences, style, and knowledge base (pgvector)
- **Procedural**: Learned workflows and patterns

### YouTube Intelligence
Deep integration with YouTube APIs:
- Real-time analytics with AI-generated insights
- Comment sentiment analysis and audience requests
- Performance pattern recognition

### Content Pipeline
Visual content planning from idea to published:
- AI-powered idea generation based on your niche
- Production status tracking
- Calendar integration

### Sponsorship Management
Track brand deals and never miss a deliverable:
- Deal pipeline with stages
- Deadline integration
- Deliverable checklist

### Daily Briefing
Start each day with an AI-generated summary:
- Top priorities for today
- Key metrics changes
- Opportunities and warnings

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
│                    (apps/mobile)                             │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│     NODE.JS BACKEND      │    │        SUPABASE          │
│     (apps/backend)       │    │    (Auth + Realtime)     │
│                          │    │                          │
│  • Fastify API Server    │    │  • Authentication        │
│  • LangGraph Agent       │    │  • Realtime (optional)   │
│  • BullMQ Background Jobs│    │                          │
│  • Google Gemini LLM     │    │                          │
└──────────────────────────┘    └──────────────────────────┘
              │
              ▼
┌──────────────────────────┐
│   DOCKER (Local Dev)     │
│                          │
│  • PostgreSQL + pgvector │
│  • Redis                 │
└──────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo |
| Routing | Expo Router (file-based) |
| State | Zustand |
| Backend | Node.js + Fastify |
| Database | PostgreSQL + pgvector (Docker) |
| ORM | Drizzle |
| Agent | LangGraph |
| Queue | BullMQ + Redis |
| LLM | Google Gemini (1.5 Pro + Flash) |
| Auth | Supabase Auth |
| Offline | SQLite (expo-sqlite) |

## Project Structure

```
agentic-creator-os/
├── apps/
│   ├── backend/              # Node.js API server
│   │   ├── src/
│   │   │   ├── api/          # Route handlers
│   │   │   ├── services/     # Business logic
│   │   │   │   └── agent/    # LangGraph orchestrator
│   │   │   ├── jobs/         # Background workers
│   │   │   ├── lib/          # Database, Redis, LLM
│   │   │   └── db/           # Drizzle schema
│   │   ├── drizzle/          # Generated migrations
│   │   ├── docker-compose.yml
│   │   └── Dockerfile
│   │
│   └── mobile/               # React Native app
│       ├── app/              # Expo Router screens
│       └── src/              # Features, services, store
│
├── packages/
│   ├── shared-types/         # Common TypeScript types
│   ├── api-client/           # Type-safe API client
│   └── config/               # Shared configuration
│
├── docs/                     # Documentation
└── supabase/                 # Supabase config (auth)
```

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Installation |
|-------------|---------|--------------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker Desktop | Latest | [docker.com](https://docker.com/products/docker-desktop) |

You'll also need accounts for:
- **Supabase** - [supabase.com](https://supabase.com) (free tier works)
- **Google Cloud** - For Gemini API key
- **YouTube API** - For creator data access

---

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/agentic-creator-os.git
cd agentic-creator-os

# Install all dependencies
pnpm install
```

---

### Step 2: Start Docker Services

Make sure **Docker Desktop is running**, then start PostgreSQL and Redis:

```bash
cd apps/backend
docker-compose up -d db redis
```

Verify services are running:
```bash
docker-compose ps
```

You should see:
```
NAME                    STATUS
backend-db-1            Up
backend-redis-1         Up
```

---

### Step 3: Configure Environment Variables

#### Backend Environment

```bash
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env` with your credentials:

```bash
# Server
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:8081,http://localhost:19006

# Database (Docker - already configured)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentic_creator

# Redis (Docker - already configured)
REDIS_URL=redis://localhost:6379

# Auth - Generate a secure secret (min 32 characters)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Supabase (for auth verification)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API
GOOGLE_API_KEY=AIzaSy...

# YouTube OAuth
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-xxx

# Push Notifications (optional)
EXPO_ACCESS_TOKEN=
```

#### Mobile Environment

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 4: Get API Credentials

#### Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key to `GOOGLE_API_KEY` in `.env`

#### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **API**
3. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_KEY`
   - `anon` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### YouTube OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3** and **YouTube Analytics API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/youtube/callback`
   - `https://your-domain.com/api/auth/youtube/callback` (for production)
7. Copy Client ID and Secret to `.env`

---

### Step 5: Run Database Migrations

```bash
cd apps/backend

# Generate migration files from schema (already done)
pnpm db:generate

# Apply migrations to database
pnpm db:migrate
```

To view your database with a visual interface:
```bash
pnpm db:studio
```

---

### Step 6: Enable pgvector Extension

Connect to PostgreSQL and enable the vector extension for semantic memory:

```bash
# Connect to database
docker exec -it backend-db-1 psql -U postgres -d agentic_creator

# Run these SQL commands:
CREATE EXTENSION IF NOT EXISTS vector;

# Add embedding column to agent_memory
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS embedding vector(768);
CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding ON agent_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

# Exit
\q
```

---

### Step 7: Start Development Servers

```bash
# From root directory - start all services
pnpm dev

# Or start individually:
cd apps/backend && pnpm dev     # Backend API (port 3000)
cd apps/mobile && pnpm start    # Expo dev server
```

---

### Step 8: Run the Mobile App

Once Expo starts, you can run the app:

- Press `i` - Open iOS Simulator
- Press `a` - Open Android Emulator
- Scan QR code - Open on physical device with Expo Go

---

## Development Commands

### Root Commands (from project root)

```bash
pnpm dev           # Start all apps
pnpm build         # Build all apps
pnpm lint          # Lint all apps
pnpm test          # Run all tests
```

### Backend Commands (from apps/backend)

```bash
pnpm dev           # Start with hot reload
pnpm build         # Compile TypeScript
pnpm start         # Run production build
pnpm start:worker  # Run background job worker

# Database
pnpm db:generate   # Generate migrations from schema
pnpm db:migrate    # Apply migrations
pnpm db:studio     # Open Drizzle Studio (visual DB browser)
```

### Mobile Commands (from apps/mobile)

```bash
pnpm start         # Start Expo dev server
pnpm ios           # Run on iOS Simulator
pnpm android       # Run on Android Emulator
pnpm lint          # Lint code
pnpm typecheck     # Check TypeScript types
```

### Docker Commands (from apps/backend)

```bash
docker-compose up -d db redis    # Start DB and Redis only
docker-compose up                # Start all services
docker-compose down              # Stop all services
docker-compose logs -f db        # View database logs
docker-compose ps                # Check service status
```

---

## Usage Examples

### Chat Commands

```
"What should I focus on today?"
→ Returns highest-impact action with reasoning

"Analyze my last video's performance"
→ Provides CTR, retention, and improvement suggestions

"Create a task to edit the sponsor segment by Friday"
→ Creates task with deadline and priority

"Generate 5 video ideas for my tech niche"
→ AI-generated ideas based on your channel's patterns
```

---

## Troubleshooting

### Docker Issues

**Docker daemon not running:**
```bash
# Make sure Docker Desktop is open and running
# Then retry:
docker-compose up -d db redis
```

**Port already in use:**
```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill the process or change ports in docker-compose.yml
```

### Database Issues

**Migration fails:**
```bash
# Make sure Docker is running and database is accessible
docker-compose ps

# Check database logs
docker-compose logs db

# Try connecting manually
docker exec -it backend-db-1 psql -U postgres -d agentic_creator
```

**Reset database:**
```bash
docker-compose down -v  # Removes volumes (data)
docker-compose up -d db redis
pnpm db:migrate
```

### Mobile Issues

**Metro bundler issues:**
```bash
# Clear cache and restart
cd apps/mobile
npx expo start --clear
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design and data flows |
| [API Reference](docs/api.md) | REST API and WebSocket endpoints |
| [Database Schema](docs/database.md) | Table definitions and relationships |
| [Agent System](docs/agent.md) | LangGraph orchestrator and tools |
| [Deployment](docs/deployment.md) | Production setup guide |

---

## Deployment

### Backend (Railway/Render/Fly.io)

```bash
# Railway
railway up

# Or use Dockerfile
docker build -t agentic-backend apps/backend
```

Environment variables for production:
- Set `DATABASE_URL` to production PostgreSQL (Supabase/Neon)
- Set `REDIS_URL` to production Redis (Upstash)
- Set `NODE_ENV=production`

### Mobile (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for stores
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.
