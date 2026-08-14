# Agentic Creator OS - Project Status & Vision

> AI-powered operating system for YouTube creators with a chat-first interface.

---

## Table of Contents

1. [Core Vision & Ideation](#core-vision--ideation)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Status](#implementation-status)
4. [Completed Features](#completed-features)
5. [Pending Implementation](#pending-implementation)
6. [Technical Specifications](#technical-specifications)
7. [Next Steps](#next-steps)

---

## Core Vision & Ideation

### The Problem

YouTube creators face overwhelming complexity in managing their business:

- **Content Planning**: Deciding what to create next based on audience demand, trends, and personal capacity
- **Analytics Overload**: YouTube Studio provides data but not actionable insights
- **Task Fragmentation**: Managing scripts, filming, editing, thumbnails, SEO across multiple tools
- **Sponsorship Chaos**: Tracking deals, deliverables, deadlines across email threads
- **Opportunity Blindness**: Missing trends, comment requests, and optimal posting times

### The Solution

**Agentic Creator OS** is an AI-powered command center that transforms how creators work:

```
Traditional Approach:
"What task do you want to perform?"
↓
Creator must know what to do, when, and how

Creator OS Approach:
"Given everything happening in your creator business, what should you do next?"
↓
AI analyzes all signals and recommends the highest-impact action
```

### Core Differentiators

#### 1. Highest-Impact Next Action (Signature Feature)

The system continuously calculates what the creator should focus on using a multi-factor scoring algorithm:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Urgency** | 25% | Deadline proximity, time-sensitive opportunities |
| **Revenue Impact** | 20% | Potential earnings from sponsorships, ad revenue |
| **Audience Impact** | 20% | Subscriber growth, engagement potential |
| **Goal Alignment** | 15% | How well it matches creator's stated goals |
| **Effort (Inverse)** | 10% | Quick wins scored higher |
| **Momentum** | 10% | Building on recent successes |

Example output:
> "Your top priority today: **Reply to Northwind Audio's partnership offer** (+$3,500 potential, expires tomorrow). After that, film the AI Tools video - it's trending +24% this week with your audience."

#### 2. Creator Memory (Three-Tier System)

The AI maintains persistent memory about the creator:

**Episodic Memory** (Short-term)
- Recent conversation history
- Current session context
- Active tasks and their status

**Semantic Memory** (Long-term)
- Creator preferences ("I prefer filming on Tuesdays")
- Content style ("My audience likes deep-dives over quick tips")
- Business rules ("Never accept sponsors under $2,000")
- Goals ("Reach 500K subscribers by December")

**Procedural Memory** (Learned Patterns)
- Workflow automations ("When a video hits 100K views, create a Shorts version")
- Response templates
- Decision patterns

#### 3. YouTube Knowledge Base

Deep integration with YouTube data:

- **Video Performance**: Views, CTR, retention curves, revenue
- **Audience Intelligence**: Demographics, watch patterns, peak times
- **Comment Mining**: Extract video requests, sentiment, FAQ patterns
- **Trend Detection**: What's working, what's declining
- **Competitor Signals**: (Future) Track industry benchmarks

#### 4. Proactive AI Agent

The system doesn't wait for commands - it reaches out:

- **Morning Briefing**: "Good morning! Here's your day: 2 tasks due, channel grew +847 subs, trending topic in your niche..."
- **Opportunity Alerts**: "Your last video is outperforming - consider a follow-up while interest is high"
- **Risk Warnings**: "Sponsor deadline in 24 hours - deliverable not marked complete"
- **Insight Notifications**: "Audience retention drops at 8:00 mark in recent videos - consider shorter intros"

#### 5. Content Intelligence Engine

AI-powered content ideation:

- Analyzes top-performing videos to extract winning formulas
- Monitors comments for "I wish you'd make a video about..."
- Tracks trending topics in creator's niche
- Generates personalized ideas with impact scores
- Suggests repurposing (Long-form → Shorts, Blog, Twitter thread)

### User Personas

#### Primary: The Scaling Creator (50K - 500K subscribers)
- Posts 2-4 videos/month
- Has sponsorship inquiries
- Struggles with consistency and planning
- Wants to grow but overwhelmed by admin

#### Secondary: The Emerging Creator (10K - 50K subscribers)
- Finding their niche
- Learning what works
- Needs guidance on content strategy
- Limited time (often has day job)

### Key User Journeys

#### Journey 1: Daily Check-in
```
Creator opens app → Morning briefing appears →
Shows today's priority + quick stats →
Creator asks "What should I film next?" →
AI recommends top 3 ideas with rationale →
Creator picks one, AI creates task list →
Creator starts work with clear direction
```

#### Journey 2: Sponsor Management
```
Creator receives sponsor email →
Tells AI "I got an offer from TechBrand for $4,000" →
AI creates deal, extracts deliverables from email →
AI tracks deadlines, reminds of due dates →
AI calculates if deal is worth it vs. time investment →
Creator makes informed decision
```

#### Journey 3: Performance Review
```
Creator asks "How did my last video do?" →
AI shows performance vs. channel average →
Highlights what worked (hook, topic, thumbnail) →
Shows audience retention curve with commentary →
Suggests optimizations for next video
```

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP                          │
│  ┌─────────┬───────────┬──────────┬──────────┬───────────┐  │
│  │  Chat   │ Dashboard │ Calendar │ Timeline │ Settings  │  │
│  └─────────┴───────────┴──────────┴──────────┴───────────┘  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Zustand (State) │ SQLite (Offline) │ Push Handler     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              FASTIFY BACKEND (Node.js)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes: /chat/stream │ /tasks │ /content │ /yt  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services: Agent │ YouTube │ Briefing │ Impact       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Jobs (BullMQ): youtube-sync │ briefing │ impact     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   LANGGRAPH     │ │   YOUTUBE API   │ │     REDIS       │
│   + GEMINI      │ │   Data + OAuth  │ │   Job Queues    │
│   Agent Brain   │ │   Analytics     │ │   Caching       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL + pgvector)                │
│  ┌────────────────┬────────────────┬────────────────────┐   │
│  │ Creator Memory │ Content Ideas  │ YouTube Analytics  │   │
│  │ Tasks/Sponsors │ Conversations  │ Agent Memory (RAG) │   │
│  └────────────────┴────────────────┴────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack Decisions

| Layer | Technology | Why |
|-------|------------|-----|
| **Mobile** | React Native + Expo | Cross-platform, OTA updates, managed workflow |
| **Backend** | Node.js + Fastify | Fast, TypeScript native, great DX |
| **Database** | Supabase (PostgreSQL) | pgvector for RAG, real-time, RLS, auth built-in |
| **Agent** | LangGraph + Gemini | Stateful workflows, tool calling, 44% production adoption |
| **Jobs** | BullMQ + Redis | Reliable background jobs, scheduling |
| **State** | Zustand | Simple, performant, TypeScript friendly |

### Agent System Design

```
USER MESSAGE
    │
    ▼
┌─────────────────┐
│ CONTEXT BUILDER │ ← Retrieves creator memory, recent history
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    CLASSIFY     │ ← Determines intent (question, task, analysis)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      PLAN       │ ← Decides which tools to use
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ EXECUTE TOOLS   │ ← Runs: createTask, getAnalytics, generateIdeas...
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    RESPOND      │ ← Streams response via SSE
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PERSIST MEMORY  │ ← Extracts facts, updates semantic memory
└─────────────────┘
```

### Available Agent Tools

| Category | Tools | Description |
|----------|-------|-------------|
| **Tasks** | `createTask`, `listTasks`, `updateTask`, `setReminder` | Manage creator's to-do list |
| **Analytics** | `getVideoPerformance`, `getChannelStats`, `compareVideos` | YouTube data insights |
| **Content** | `generateIdeas`, `listIdeas`, `updateIdea`, `getPipeline` | Content planning |
| **Calendar** | `getEvents`, `addEvent`, `findSlots`, `scheduleContent` | Scheduling |
| **Sponsors** | `listDeals`, `getDeliverables`, `trackStatus` | Sponsorship management |
| **Memory** | `saveMemory`, `queryMemory`, `updatePreferences` | Creator knowledge |
| **Impact** | `calculateImpact`, `getRecommendation` | Priority scoring |

---

## Implementation Status

### Overview

| Category | Completed | Pending | Progress |
|----------|-----------|---------|----------|
| **UI Screens** | 12 | 3 | 80% |
| **Backend — Platform & Data (Josh)** | Auth, DB, YouTube OAuth+sync, Task/Content/Sponsorship CRUD, daily sync job | Social login (Google/GitHub/X) | ~95% |
| **Backend — Agent & Workflows (Ash)** | 0 | Chat API, SSE streaming, LangGraph, workflows | 0% |
| **Backend — Intelligence (Suba)** | 0 | Memory, impact scoring, insights, briefing | 0% |
| **State Management** | Auth/Creator stores wired to real backend | Chat/Briefing store integration | ~50% |
| **API Integration** | Auth, Tasks, Content, YouTube screens (Dashboard, Settings) | Chat, Calendar, Timeline, list screens (Priority 6) | ~40% |
| **Agent System** | 0 | 1 (LangGraph orchestrator — Ash) | 0% |

### Visual Progress

```
UI Screens              [████████████████████░░░░] 80%
Backend (Platform/Data) [███████████████████████░] 95%
Backend (Agent/Chat)    [░░░░░░░░░░░░░░░░░░░░░░░░]  0%
Backend (Intelligence)  [░░░░░░░░░░░░░░░░░░░░░░░░]  0%
State Mgmt              [████████████░░░░░░░░░░░░] 50%
API Integration         [██████████░░░░░░░░░░░░░░] 40%
Agent System            [░░░░░░░░░░░░░░░░░░░░░░░░]  0%
─────────────────────────────────────────────────────
Overall                 [████████████░░░░░░░░░░░░] 48%
```

> Josh's full backend slice (Platform & Data) is implemented and tested live against the real DB/Supabase/YouTube APIs — see [6. Backend — Platform & Data](#6-backend--platform--data-josh--complete) below. Ash's (chat/workflows) and Suba's (intelligence/memory) backend slices are still unbuilt.

---

## Completed Features

### 1. Design System (Theme)

**File**: `apps/mobile/src/theme/index.ts`

```typescript
// Dark F1/Racing inspired palette
colors: {
  background: '#000000',        // Pure black
  surface: '#1C1C1E',           // Card backgrounds
  surfaceElevated: '#2C2C2E',   // Elevated elements

  // Neon accents
  accent: '#0A84FF',            // Electric blue
  lime: '#D4FF00',              // Neon lime (primary CTA)
  teal: '#00D4AA',              // Success/positive
  orange: '#FF9500',            // Warning/attention
  red: '#FF453A',               // Error/danger

  // F1 team colors (for variety)
  ferrari: '#DC0000',
  mclaren: '#FF8700',
  mercedes: '#00D2BE',
}
```

### 2. Main Tab Screens (5 screens)

#### Dashboard (`app/(main)/dashboard/index.tsx`) — ⚠️ now wired to real data (see [6.7](#6-backend--platform--data-josh--complete))
- Time-based greeting with the real logged-in creator's name
- Hero stats card: real total views/hours/subscribers from the last 30 days, real week-over-week trend (hidden if not enough data yet)
- "Connect YouTube" prompt card when no channel is connected yet, instead of showing stats
- Quick action buttons (New Video, Add Idea, Analytics, Schedule) — still non-functional, no screens/backend behind them yet
- AI Assistant card (navigates to chat, which is still fully mocked)
- Recent Videos list — real synced videos, replacing the old fake "Recent Activity" feed
- Removed: the fake monthly-goal progress ring (47%) — no real "goal" concept exists in the schema yet

#### Calendar (`app/(main)/calendar/index.tsx`)
- Next event hero with countdown timer (days, hours, minutes)
- Orange gradient background
- Schedule list with date badges
- Event types (Publish, Film, Edit, Call, Plan)
- Quick add buttons for common events

#### Timeline/Stats (`app/(main)/timeline/index.tsx`)
- Most successful video hero (teal gradient)
- Stat cards (Most Successful Category, Best Growth Month)
- Total watch time display
- Share stats card (lime gradient)
- Video rankings list with tabs (Top Videos, Revenue, Growth)
- Category color coding

#### Chat (`app/(main)/chat/index.tsx`)
- AI Chat header badge
- Welcome card with icon
- 4 suggestion prompts (Focus, Channel, Ideas, Schedule)
- User message bubbles (blue, right-aligned)
- Assistant messages with avatar
- Action cards in responses (deal review, performance, ideas)
- Typing indicator animation
- Input field with send button

#### Settings (`app/(main)/settings/index.tsx`) — ⚠️ now wired to real data (see [6.7](#6-backend--platform--data-josh--complete))
- Profile header with real logged-in creator's name/initial (non-interactive avatar — was a dead button)
- Upgrade to Pro card (accent gradient) — still non-functional, no billing built
- YouTube connection status card — real; tappable to connect when not linked, shows real channel/subscriber count when connected
- Account section — Profile row shows real email; Password/Notifications rows still non-functional
- Preferences (Dark Mode, Daily Briefing, Language) — still non-functional, no settings persistence built
- "Last 30 Days" stats cards — real views/new subs/hours watched (only shown once YouTube is connected; the old fake "$8.2K Revenue" card was removed, no revenue data source exists)
- Sign out button — real, calls backend logout and clears session
- Support section, version footer — unchanged, non-functional

### 3. Auth Screens (4 screens)

#### Login (`app/(auth)/login.tsx`) — ✅ wired to real backend (see [6.7](#6-backend--platform--data-josh--complete))
- Brand logo with lime gradient
- "Creator OS" branding
- Email input with mail icon
- Password input with visibility toggle
- Forgot password link — still non-functional
- Lime gradient sign-in button — real, calls `POST /api/auth/login`
- Divider with "or continue with"
- Social login buttons (Google, GitHub, X) — **still unwired, no `onPress` handlers** (deferred; see note below)
- Sign up link footer

#### Register (`app/(auth)/register.tsx`) — ✅ wired to real backend
- Back navigation button
- Form fields: Name, Email, Password, Confirm Password
- Terms and privacy policy text
- Accent gradient create account button — real, calls `POST /api/auth/register`; Supabase requires email confirmation before login
- Sign in link footer

#### Onboarding (`app/(auth)/onboarding.tsx`) — ✅ wired to real backend
- 2-step progress indicator
- **Step 1**: YouTube Connect
  - Red gradient hero card
  - YouTube icon
  - Feature benefits list (4 items)
  - Connect YouTube button — real, triggers the actual Google OAuth flow
  - Skip option
- **Step 2**: Success
  - Teal gradient hero
  - Checkmark icon
  - "What you can do" features
  - Start Using button (lime gradient)

> **Social login (Google/GitHub/X) is Josh's scope** (same `/api/auth/*` domain as email/password — it's a Supabase Auth provider, not a separate system), but hasn't been started. Needs provider apps registered (GitHub OAuth App, X/Twitter Developer App) and enabled in the Supabase dashboard before it can be wired up. Explicitly deferred for now.

#### YouTube Connect (`app/(auth)/youtube-connect.tsx`)
- Red gradient hero card
- YouTube icon
- Feature benefits list
- Error state handling
- Connect button
- Skip option
- Privacy note with shield icon

### 4. Modal Screens (3 screens)

#### Task Detail (`app/(modals)/task-detail.tsx`)
- Status badge (To Do, In Progress, Done)
- Priority badge (Low, Medium, High, Urgent)
- Task title
- Due date card with orange gradient accent
- Description section
- Details card:
  - Category
  - Linked Content
  - Reminder
  - Created date
- Status update buttons (toggle between states)
- Action bar: Delete (red) + Mark Complete (lime gradient)

#### Idea Detail (`app/(modals)/idea-detail.tsx`)
- Impact score hero (teal gradient)
  - Large score number (92)
  - Impact meter bar
  - Stats row: Est. Views, Audience Match, Trending
- Category + Source badges
- Title
- Pipeline progress tracker (5 stages):
  - Draft → Scripting → Filming → Editing → Published
  - Visual dots and lines showing progress
- Description
- Tags row
- Suggested outline (numbered list)
- Related videos list
- Action bar: Archive + Start Production

#### Video Detail (`app/(modals)/video-detail.tsx`)
- Video hero with thumbnail placeholder
- Category badge, title, publish date
- Stats grid (4 cards):
  - Views, Watch Time, Likes, Subs Gained
- Tab navigation: Overview | Audience | AI Insights
- **Overview Tab**:
  - Retention graph with bars
  - Performance metrics table
  - Traffic sources with bars
- **Audience Tab**:
  - Top countries list
  - Demographics card (gender, age, returning)
- **AI Insights Tab**:
  - Insight cards with colored left border
  - Positive (teal), Warning (orange), Tip (lime)
- Action bar: Share Stats + Open in YouTube

### 5. Navigation & Layouts

#### Root Layout (`app/_layout.tsx`)
- Expo Router stack
- Font loading
- Auth state management (placeholder)

#### Main Layout (`app/(main)/_layout.tsx`)
- Custom tab bar (floating, rounded)
- 5 tabs with icons
- Active state highlighting

#### Auth Layout (`app/(auth)/_layout.tsx`)
- Stack navigator for auth flow
- No header

#### Modals Layout (`app/(modals)/_layout.tsx`)
- Modal presentation style
- Dark header styling
- Screen configurations

### 6. Backend — Platform & Data (Josh) ✅ Complete

Everything below is implemented and verified against the real Postgres DB (Docker), Redis, Supabase project, and live Google/YouTube OAuth — not just written, actually exercised end-to-end.

#### 6.1 Server & Infra
- Fastify server (`apps/backend/src/server.ts`) — CORS, helmet, rate limiting, error handling
- `.env` loading fixed — scaffolding had no `dotenv`/`--env-file`, would throw on boot
- `lib/database.ts` — Drizzle client typing fixed (was silently losing schema types, invisible at runtime but blocked real type-checking)

#### 6.2 Database (`apps/backend/src/db/schema.ts`)
16 tables, all migrated. Added during implementation (schema gaps found while wiring real routes):
- `sponsorship_deliverables` (table didn't exist; route stub referenced it)
- `tasks.reminder_at` (column missing; `/reminder` endpoint had nothing to write to)
- `video_analytics` (table didn't exist; needed for YouTube analytics sync)
- `creators.youtube_access_token` (schema had a token-expiry column but nowhere to cache the token itself)

#### 6.3 Auth (`/api/auth/*`)
- Real Supabase Auth verification in `middleware/auth.ts` (was previously faking `creatorId = userId` with no DB lookup)
- `findOrCreateCreator()` — auto-creates a `creators` row on first sign-in
- `register`, `login`, `refresh`, `logout`, `me` — all backed by Supabase, tested live (register → confirm → login → protected route)
- Fixed: register wasn't passing `emailRedirectTo`, so confirmation emails redirected to the bare API instead of the app

#### 6.4 YouTube OAuth + Sync (`/api/auth/youtube/*`, `/api/youtube/*`, `services/youtube/`)
- Full OAuth flow: `connect` → Google consent → `callback` → token exchange → channel sync, tested live with a real Google account
- Redis-backed, single-use, CSRF-safe `state` tokens (10 min TTL) tying the OAuth round trip back to the right creator
- `redirectTo` support so the callback can return to a web app tab (not just a native deep link), validated against `CORS_ORIGINS` as an allowlist (closes an open-redirect risk)
- `syncChannel()`, `syncVideos()`, `syncAnalytics()` — pulls channel stats, video list, and 30 days of per-video daily analytics
- Token refresh with a 5-minute expiry buffer, cached access token to avoid unnecessary refreshes
- **Daily background sync job** — `syncAllCreators()` was a stub (fired at 3 AM, did nothing); now fans out one sync job per connected creator via BullMQ. Required adding `initQueue()` to `worker.ts`, which never called it.

#### 6.5 Task CRUD (`/api/tasks/*`)
Full CRUD + status filtering + reminders. `status: 'completed'` auto-stamps/clears `completedAt`.

#### 6.6 Content CRUD (`/api/content/*`)
- Ideas: full CRUD (`/ideas/generate` reserved for Suba's AI generation, returns 501)
- Pipeline: full CRUD
- Sponsorships + nested deliverables: full CRUD, including ownership checks (a deliverable can't be accessed through a sponsorship that isn't yours)
- Note: sponsorships live under `/api/content/sponsorships/*`, not a standalone `/api/sponsors/*` — followed the existing scaffold's structure rather than the original doc's route naming; functionally complete either way

#### 6.7 Mobile ↔ Backend Wiring
The mobile app was UI-only before this — every screen below was hardcoded mock data with no working auth. Now wired to the real backend:
- `src/services/api.ts` (new) — typed backend client, replacing direct-Supabase calls
- `src/services/youtube.ts` — replaced dead client-side OAuth code with `startYoutubeConnect()`, platform-aware (web: full-page redirect; native: in-app browser + deep link)
- Login/Register — real backend auth (was calling Supabase directly with a blank anon key, silently broken)
- **Auth guard added to `(main)` layout** — didn't exist; an unauthenticated session could sit on any main-tab screen with no token instead of being redirected to login
- **Redirect-loop bug fixed** in `(auth)/_layout.tsx` — onboarding's own layout was redirecting to itself
- Dashboard & Settings — real channel/video/analytics data, connect-YouTube empty states, no more hardcoded "James Chen" / "TechWithJames"
- Cross-platform `showAlert()` helper — `Alert.alert()` silently no-ops on web (react-native-web has no implementation), which was stalling the register success flow

**Not done**: social login (Google/GitHub/X buttons exist, unwired — explicitly deferred), `register.tsx`'s downstream screens beyond auth (chat, calendar, timeline still fully mock).

---

## Pending Implementation

### Priority 1: Backend Foundation (Critical Path) — ✅ Done

See [6. Backend — Platform & Data](#6-backend--platform--data-josh--complete) above for what actually shipped. Spec below kept for reference.

#### 1.1 Fastify Server Setup
**Location**: `apps/backend/src/index.ts`

```typescript
// Required structure
- Server initialization
- Route registration
- CORS configuration
- Error handling
- Environment validation
```

**Routes to implement**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/stream` | POST | SSE streaming chat |
| `/api/chat/ws` | GET | WebSocket chat (alternative) |
| `/api/tasks` | GET, POST, PUT, DELETE | Task CRUD |
| `/api/content/ideas` | GET, POST, PUT | Content ideas |
| `/api/youtube/sync` | POST | Trigger sync |
| `/api/youtube/channel` | GET | Channel data |
| `/api/youtube/videos` | GET | Video list |
| `/api/youtube/analytics` | GET | Analytics data |
| `/api/auth/youtube` | GET | OAuth initiation |
| `/api/auth/youtube/callback` | GET | OAuth callback |

#### 1.2 Database Schema
**Location**: `apps/backend/src/db/schema.ts`

**Core Tables**:

```sql
-- Creators
creators (
  id, email, display_name, avatar_url,
  onboarding_completed, created_at, updated_at
)

-- Creator Memory (Key-Value with confidence)
creator_memory (
  id, creator_id, key, value, confidence,
  source, created_at, updated_at
)

-- YouTube Channels
youtube_channels (
  id, creator_id, channel_id, title,
  subscriber_count, video_count,
  access_token, refresh_token, token_expires_at,
  sync_status, last_synced_at
)

-- YouTube Videos
youtube_videos (
  id, channel_id, video_id, title, description,
  thumbnail_url, published_at, duration,
  view_count, like_count, comment_count,
  tags, category_id
)

-- Video Analytics (Time-series)
video_analytics (
  id, video_id, date, views, watch_time_minutes,
  likes, comments, shares, subscribers_gained,
  ctr, avg_view_duration, avg_view_percentage
)

-- Content Ideas
content_ideas (
  id, creator_id, title, description,
  source, category, status, impact_score,
  estimated_views, tags, outline,
  created_at, updated_at
)

-- Tasks
tasks (
  id, creator_id, title, description,
  status, priority, due_date, category,
  linked_content_id, reminder_at,
  created_at, updated_at, completed_at
)

-- Sponsorships
sponsorships (
  id, creator_id, brand_name, contact_email,
  amount, currency, status, notes,
  contract_start, contract_end
)

-- Sponsorship Deliverables
sponsorship_deliverables (
  id, sponsorship_id, title, description,
  type, due_date, status, linked_video_id
)

-- Conversations
conversations (
  id, creator_id, title, created_at, updated_at
)

-- Messages
messages (
  id, conversation_id, role, content,
  tool_calls, tool_results, created_at
)

-- Agent Memory (Vector embeddings)
agent_memory (
  id, creator_id, content, embedding,
  memory_type, metadata, created_at
)
-- Note: embedding column uses pgvector

-- Daily Briefings
daily_briefings (
  id, creator_id, date, content,
  priorities, insights, created_at
)

-- Impact Scores
impact_scores (
  id, creator_id, date, scores,
  top_recommendation, created_at
)
```

#### 1.3 Authentication System
**Files**:
- `apps/backend/src/lib/supabase.ts` - Supabase client
- `apps/backend/src/middleware/auth.ts` - JWT validation
- `apps/mobile/src/services/supabase.ts` - Complete implementation

**Required**:
```typescript
// Mobile: src/services/supabase.ts
export async function signIn(email: string, password: string): Promise<User>
export async function signUp(email: string, password: string, name: string): Promise<User>
export async function signOut(): Promise<void>
export async function getSession(): Promise<Session | null>
export async function refreshSession(): Promise<Session>
export function onAuthStateChange(callback: (session: Session | null) => void): Subscription
```

### Priority 2: Agent System — ⏳ Pending (Ash's scope: Agentic Chat & Workflows)

Not started. Chat screen is still a fully hardcoded mock (canned replies, fake typing delay) with no backend behind it.

#### 2.1 LangGraph Orchestrator
**Location**: `apps/backend/src/services/agent/orchestrator.ts`

```typescript
// Core agent loop
const agentGraph = new StateGraph({
  channels: {
    messages: [],
    creatorContext: {},
    toolResults: [],
  }
})
  .addNode("contextBuilder", buildContext)
  .addNode("classify", classifyIntent)
  .addNode("plan", planActions)
  .addNode("executeTools", executeTools)
  .addNode("respond", generateResponse)
  .addNode("persistMemory", saveMemory)
  .addEdge("contextBuilder", "classify")
  .addEdge("classify", "plan")
  .addEdge("plan", "executeTools")
  .addEdge("executeTools", "respond")
  .addEdge("respond", "persistMemory");
```

#### 2.2 Agent Tools Implementation
**Location**: `apps/backend/src/services/agent/tools/`

```
tools/
├── taskTools.ts      # createTask, listTasks, updateTask, setReminder
├── analyticsTools.ts # getVideoPerformance, getChannelStats, compareVideos
├── contentTools.ts   # generateIdeas, listIdeas, updateIdea, getPipeline
├── calendarTools.ts  # getEvents, addEvent, findSlots, scheduleContent
├── sponsorTools.ts   # listDeals, getDeliverables, trackStatus
├── memoryTools.ts    # saveMemory, queryMemory, updatePreferences
└── impactTools.ts    # calculateImpact, getRecommendation
```

#### 2.3 Memory System
**Location**: `apps/backend/src/services/agent/memory/`

```typescript
// Semantic memory with pgvector
async function storeMemory(creatorId: string, content: string, type: MemoryType) {
  const embedding = await embedText(content); // Gemini text-embedding-004
  await db.insert(agentMemory).values({
    creator_id: creatorId,
    content,
    embedding,
    memory_type: type,
  });
}

async function queryMemory(creatorId: string, query: string, limit = 5) {
  const queryEmbedding = await embedText(query);
  return db.execute(sql`
    SELECT content, 1 - (embedding <=> ${queryEmbedding}) as similarity
    FROM agent_memory
    WHERE creator_id = ${creatorId}
    ORDER BY embedding <=> ${queryEmbedding}
    LIMIT ${limit}
  `);
}
```

### Priority 3: YouTube Integration — ✅ Done

See [6.4](#6-backend--platform--data-josh--complete) above. Spec below kept for reference.

#### 3.1 OAuth Flow
**Backend**: `apps/backend/src/api/auth/youtube.ts`
**Mobile**: `apps/mobile/src/services/youtube.ts`

```typescript
// Scopes needed
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
];
```

#### 3.2 Sync Service
**Location**: `apps/backend/src/services/youtube/sync.ts`

```typescript
// Daily sync job (3 AM creator timezone)
async function syncCreatorData(creatorId: string, fullSync = false) {
  const channel = await fetchChannel();
  const videos = await fetchVideos(fullSync ? undefined : lastSyncDate);
  const analytics = await fetchAnalytics(videos.map(v => v.id));

  await updateDatabase(channel, videos, analytics);
  await generateInsights(creatorId);
}
```

#### 3.3 Quota Management — ⏳ Still a stub
`checkQuota()` returns a fixed placeholder; real quota tracking wasn't implemented.
```typescript
// YouTube API costs (10,000 units/day)
const QUOTA_COSTS = {
  'videos.list': 1,
  'channels.list': 1,
  'commentThreads.list': 1,
  'search.list': 100,  // Avoid!
  'analytics': 0,      // Separate quota
};

// Track and limit usage
async function checkQuota(operation: string): Promise<boolean>
```

### Priority 4: Background Jobs — ✅ Done (YouTube sync) / ⏳ Pending (briefing, impact — Suba's scope)

YouTube sync's daily 3 AM fan-out is implemented and tested against the live worker process. Briefing and impact-score workers still call stub helpers (`generateAllBriefings()`, `calculateAllImpactScores()`) — that's Suba's Intelligence scope, not touched here.

#### 4.1 BullMQ Workers
**Location**: `apps/backend/src/jobs/`

```typescript
// YouTube Sync (Daily 3 AM UTC)
const youtubeSyncWorker = new Worker('youtube-sync', async (job) => {
  const { creatorId } = job.data;
  await syncCreatorData(creatorId);
});

// Daily Briefing (Daily 6 AM creator timezone)
const briefingWorker = new Worker('briefing', async (job) => {
  const { creatorId } = job.data;
  const briefing = await generateBriefing(creatorId);
  await sendPushNotification(creatorId, briefing);
});

// Impact Score Calculation (Daily 5 AM UTC)
const impactWorker = new Worker('impact-score', async (job) => {
  const { creatorId } = job.data;
  await calculateDailyImpactScores(creatorId);
});
```

### Priority 5: State Management — ⏳ Partially done

`authStore`/`creatorStore` are wired to the real backend (populated on login, cleared on logout). `chatStore` and briefing/impact state remain unbuilt — depend on Ash's and Suba's backend work respectively.

#### 5.1 Zustand Stores
**Location**: `apps/mobile/src/store/`

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

// chatStore.ts
interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
}

// tasksStore.ts
interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (task: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

// creatorStore.ts (expand existing)
interface CreatorState {
  profile: CreatorProfile | null;
  channel: YouTubeChannel | null;
  isYoutubeConnected: boolean;
  briefing: DailyBriefing | null;
  impactScores: ImpactScore[];
  // ... methods
}
```

### Priority 6: Additional UI Screens — ⏳ Pending

None of these list screens exist yet; the backend APIs they'd call (`/api/content/ideas`, `/api/tasks`, `/api/content/sponsorships`) are ready and tested.

#### 6.1 Content Ideas List
**File**: `app/(main)/ideas/index.tsx`
- List of AI-generated ideas
- Filter by status (Draft, Scripting, etc.)
- Sort by impact score
- Quick actions (Start, Archive)

#### 6.2 Tasks List
**File**: `app/(main)/tasks/index.tsx`
- Grouped by status
- Filter by priority/category
- Due date indicators
- Bulk actions

#### 6.3 Sponsorships
**File**: `app/(main)/sponsors/index.tsx`
- Active deals list
- Pipeline view
- Deliverable tracking
- Revenue summary

#### 6.4 Daily Briefing
**File**: `app/(main)/briefing/index.tsx`
- Morning summary view
- Today's priorities
- Key metrics
- AI insights

---

## Technical Specifications

### API Response Formats

```typescript
// Standard success response
interface ApiResponse<T> {
  success: true;
  data: T;
}

// Error response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Paginated response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}
```

### SSE Streaming Format

```typescript
// Chat streaming events
type StreamEvent =
  | { type: 'start'; conversationId: string }
  | { type: 'token'; content: string }
  | { type: 'tool_start'; tool: string; input: any }
  | { type: 'tool_end'; tool: string; output: any }
  | { type: 'done'; messageId: string }
  | { type: 'error'; error: string };
```

### Environment Variables

```bash
# Backend (apps/backend/.env) — see docs/RUNNING_THE_APP.md for full setup
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
APP_WEB_URL=http://localhost:8081   # Supabase auth email redirect target

# Database (local Docker by default)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentic_creator

# Redis (local Docker by default)
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-32-char-secret

# Supabase (used for auth verification, not data storage in local-Docker mode)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# LLM
GOOGLE_API_KEY=AIza...

# YouTube
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback

# Mobile (apps/mobile/.env)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon key — not required for auth (routes through backend), only for legacy direct-Supabase calls
```

---

## Next Steps

### Phase 1: Backend Foundation (Week 1-2)

1. **Day 1-2**: Fastify server setup, route structure
2. **Day 3-4**: Drizzle schema, migrations, Supabase connection
3. **Day 5-6**: Auth system (Supabase Auth integration)
4. **Day 7**: YouTube OAuth flow

### Phase 2: Agent MVP (Week 3-4)

1. **Day 1-3**: LangGraph orchestrator, basic tool calling
2. **Day 4-5**: SSE streaming endpoint
3. **Day 6-7**: Frontend chat integration

### Phase 3: Data Layer (Week 5-6)

1. **Day 1-2**: YouTube sync service
2. **Day 3-4**: Background jobs (BullMQ)
3. **Day 5-6**: State management (Zustand stores)
4. **Day 7**: API integration for all screens

### Phase 4: Intelligence (Week 7-8)

1. **Day 1-2**: Semantic memory (pgvector)
2. **Day 3-4**: Impact score calculation
3. **Day 5-6**: Content idea generation
4. **Day 7**: Daily briefing system

### Phase 5: Polish (Week 9-10)

1. **Day 1-2**: Push notifications
2. **Day 3-4**: Offline support (SQLite)
3. **Day 5-6**: Error handling, loading states
4. **Day 7**: Testing, bug fixes

---

## File Structure Reference

```
/agentic-creator-os
├── apps/
│   ├── mobile/                      # React Native + Expo
│   │   ├── app/                     # Expo Router screens
│   │   │   ├── (auth)/              # Auth screens ✅
│   │   │   ├── (main)/              # Tab screens ✅
│   │   │   ├── (modals)/            # Modal screens ✅
│   │   │   └── _layout.tsx          # Root layout ✅
│   │   ├── src/
│   │   │   ├── components/          # Shared components ❌
│   │   │   ├── features/            # Feature modules ❌
│   │   │   ├── hooks/               # Custom hooks ❌
│   │   │   ├── services/            # API services ✅ (api.ts, youtube.ts — real backend calls)
│   │   │   ├── store/               # Zustand stores ⚠️ (auth/creator real, chat/briefing stub)
│   │   │   ├── utils/               # ✅ alert.ts (cross-platform Alert.alert fix)
│   │   │   └── theme/               # Design system ✅
│   │   └── package.json
│   │
│   └── backend/                     # Node.js + Fastify ⚠️ (Platform/Data ✅, Agent+Intelligence ❌)
│       ├── src/
│       │   ├── api/                 # Route handlers — auth/tasks/content/youtube ✅, chat ❌
│       │   ├── services/
│       │   │   ├── agent/           # LangGraph + tools ❌ (Ash)
│       │   │   ├── youtube/         # YouTube API ✅
│       │   │   └── briefing/        # Daily briefing ❌ (Suba)
│       │   ├── jobs/                # BullMQ workers — YouTube sync ✅, briefing/impact ❌
│       │   ├── lib/                 # Database, Redis, LLM ✅
│       │   └── db/
│       │       └── schema.ts        # Drizzle schema ✅ (16 tables, migrated)
│       └── package.json
│
├── packages/
│   ├── shared-types/                # TypeScript types ❌
│   └── api-client/                  # Type-safe client ❌
│
├── PROJECT_STATUS.md                # This file ✅
├── CLAUDE.md                        # AI instructions ✅
└── package.json                     # Monorepo root ✅

Legend: ✅ Complete | ⚠️ Partial | ❌ Not Started
```

---

*Last Updated: 2026-08-14 — Josh's Platform & Data backend slice completed and verified live (auth, DB, YouTube OAuth+sync, Task/Content/Sponsorship CRUD, daily sync job), plus mobile auth/YouTube wiring and several bug fixes (auth guard, redirect loop, web Alert fallback). See [docs/RUNNING_THE_APP.md](./RUNNING_THE_APP.md) for local setup.*
*Version: 0.2.0-alpha*
