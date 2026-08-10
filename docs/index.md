# Agentic Creator OS Documentation

Welcome to the Agentic Creator OS documentation. This guide covers everything you need to understand, deploy, and maintain the application.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System design, monorepo structure, data flows |
| [API Reference](./api.md) | REST API, SSE streaming, WebSocket endpoints |
| [Database Schema](./database.md) | Table definitions, relationships, RLS policies |
| [Agent System](./agent.md) | LangGraph orchestrator, tools, memory system |
| [Deployment](./deployment.md) | Production setup, Railway/Render/Fly.io guides |

---

## Getting Started

### For Developers

```bash
# Clone and install
git clone https://github.com/yourusername/agentic-creator-os.git
cd agentic-creator-os
pnpm install

# Set up environment
cp apps/backend/.env.example apps/backend/.env
# Edit with your credentials

# Start local services
cd apps/backend && docker-compose up -d db redis

# Run development
pnpm dev
```

See the main [README](../README.md) for detailed setup instructions.

### For Operators

1. Review [Architecture](./architecture.md) to understand the system
2. Follow [Deployment Guide](./deployment.md) for production setup
3. Set up monitoring and alerting
4. Configure scheduled jobs for background processing

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           React Native App                   │
│             (apps/mobile)                    │
└─────────────────────────────────────────────┘
              │                    │
              ▼                    ▼
┌──────────────────────┐  ┌──────────────────────┐
│   NODE.JS BACKEND    │  │      SUPABASE        │
│   (apps/backend)     │  │   (Data Layer)       │
│                      │  │                      │
│  • Fastify API       │  │  • PostgreSQL        │
│  • LangGraph Agent   │  │  • pgvector          │
│  • BullMQ Workers    │  │  • Auth              │
│  • Redis             │  │                      │
└──────────────────────┘  └──────────────────────┘
```

---

## Key Concepts

### Monorepo Structure

```
agentic-creator-os/
├── apps/
│   ├── backend/        # Node.js + Fastify API
│   └── mobile/         # React Native + Expo
├── packages/
│   ├── shared-types/   # Common TypeScript types
│   ├── api-client/     # Type-safe API client
│   └── config/         # Shared configuration
└── supabase/
    └── migrations/     # Database schema
```

### Agent-First Design

The application is built around an AI agent that understands the creator's entire business context. Users interact through natural language conversation rather than traditional UI navigation.

### Highest-Impact Algorithm

Weighted scoring system:
- **Urgency (25%)**: Deadline proximity
- **Revenue (20%)**: Direct or indirect revenue potential
- **Audience (20%)**: Impact on viewer growth
- **Goal Alignment (15%)**: Alignment with creator's stated goals
- **Effort (10%)**: Inverse of required effort
- **Momentum (10%)**: Building on recent success

### Three-Tier Memory

1. **Episodic**: Recent conversation history
2. **Semantic**: Vector-stored knowledge (pgvector)
3. **Procedural**: Learned workflows and patterns

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Mobile | React Native + Expo | Cross-platform app |
| Routing | Expo Router | File-based navigation |
| State | Zustand | Lightweight state management |
| Backend | Node.js + Fastify | API server |
| Database | Supabase PostgreSQL | Data persistence |
| Vector DB | pgvector | Semantic memory search |
| Agent | LangGraph | Stateful AI orchestration |
| Queue | BullMQ + Redis | Background jobs |
| LLM | Google Gemini | Reasoning (Pro/Flash) and embeddings |
| Offline | SQLite | Local data persistence |

---

## Development Workflow

### Running Locally

```bash
# All apps
pnpm dev

# Individual apps
pnpm dev:backend
pnpm dev:mobile
```

### Adding Features

1. Define types in `packages/shared-types`
2. Add API endpoints in `apps/backend/src/api`
3. Implement business logic in `apps/backend/src/services`
4. Update mobile UI in `apps/mobile`

### Testing

```bash
# Backend tests
cd apps/backend && pnpm test

# Mobile tests
cd apps/mobile && pnpm test
```

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/agentic-creator-os/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/agentic-creator-os/discussions)
