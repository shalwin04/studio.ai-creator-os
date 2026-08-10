# Database Schema Documentation

## Overview

Agentic Creator OS uses PostgreSQL with the pgvector extension for semantic search capabilities. The schema is organized into logical domains with Row-Level Security (RLS) policies ensuring data isolation between creators.

### Schema Locations

- **Drizzle ORM Schema**: `apps/backend/src/db/schema.ts` (TypeScript definitions)
- **SQL Migrations**: `supabase/migrations/` (raw SQL for Supabase)

### ORM Commands

```bash
cd apps/backend

# Generate migration from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (GUI)
pnpm db:studio
```

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    creators     │──────<│ youtube_channels│──────<│  youtube_videos │
│                 │       │                 │       │                 │
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ creator_id (FK) │       │ channel_id (FK) │
│ display_name    │       │ channel_id      │       │ video_id        │
│ email           │       │ title           │       │ title           │
│ timezone        │       │ subscriber_count│       │ published_at    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        │                                                   │
        │                                           ┌───────┴───────┐
        │                                           ▼               ▼
        │                               ┌─────────────────┐ ┌─────────────────┐
        │                               │ video_analytics │ │  video_insights │
        │                               │                 │ │                 │
        │                               │ video_id (FK)   │ │ video_id (FK)   │
        │                               │ views           │ │ insight_type    │
        │                               │ likes           │ │ content         │
        │                               │ ctr             │ │ confidence      │
        │                               └─────────────────┘ └─────────────────┘
        │
        ├──────────────────────────────────────────────────────────────────────┐
        │                                                                      │
        ▼                                                                      ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐ ┌─────────────────┐
│ creator_memory  │       │  creator_goals  │       │     tasks       │ │  content_ideas  │
│                 │       │                 │       │                 │ │                 │
│ creator_id (FK) │       │ creator_id (FK) │       │ creator_id (FK) │ │ creator_id (FK) │
│ key             │       │ title           │       │ title           │ │ title           │
│ value           │       │ target_value    │       │ status          │ │ source          │
│ confidence      │       │ progress        │       │ due_date        │ │ impact_score    │
└─────────────────┘       └─────────────────┘       └─────────────────┘ └─────────────────┘
        │                                                   │                   │
        │                                                   ▼                   ▼
        │                                           ┌─────────────────┐ ┌─────────────────┐
        │                                           │    reminders    │ │content_pipeline │
        │                                           │                 │ │                 │
        │                                           │ task_id (FK)    │ │ idea_id (FK)    │
        │                                           │ remind_at       │ │ status          │
        │                                           │ message         │ │ scheduled_date  │
        │                                           └─────────────────┘ └─────────────────┘
        │
        ├──────────────────────────────────────────────────────────────────────┐
        │                                                                      │
        ▼                                                                      ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐ ┌─────────────────┐
│  conversations  │──────<│    messages     │       │  sponsorships   │<│spnsr_deliverables│
│                 │       │                 │       │                 │ │                 │
│ id (PK)         │       │ conversation_id │       │ creator_id (FK) │ │ sponsorship_id  │
│ creator_id (FK) │       │ role            │       │ brand_name      │ │ description     │
│ title           │       │ content         │       │ deal_value      │ │ due_date        │
│ context         │       │ tool_calls      │       │ status          │ │ status          │
└─────────────────┘       └─────────────────┘       └─────────────────┘ └─────────────────┘
```

---

## Tables Reference

### creators

Primary user table linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `email` | text | User email |
| `display_name` | text | Display name |
| `avatar_url` | text | Profile image URL |
| `youtube_connected` | boolean | YouTube account linked |
| `youtube_refresh_token` | text | Encrypted OAuth refresh token |
| `youtube_token_expires_at` | timestamptz | Token expiration |
| `timezone` | text | User's timezone |
| `onboarding_completed` | boolean | Onboarding status |
| `notification_preferences` | jsonb | Push notification settings |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_creators_user_id` on `user_id`

---

### creator_memory

Key-value store for creator preferences and knowledge.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `key` | text | Memory key (e.g., "preferred_upload_day") |
| `value` | text | Memory value |
| `category` | text | Category: preference, fact, style, workflow |
| `confidence` | float | Confidence score 0-1 |
| `source` | text | How this was learned |
| `last_confirmed` | timestamptz | Last confirmation date |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_creator_memory_key` on `(creator_id, key)`
- `idx_creator_memory_category` on `(creator_id, category)`

---

### creator_goals

Tracked creator goals with progress.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `title` | text | Goal title |
| `description` | text | Goal description |
| `goal_type` | text | subscribers, views, revenue, content, custom |
| `target_value` | numeric | Target number |
| `current_value` | numeric | Current progress |
| `unit` | text | Unit of measurement |
| `deadline` | timestamptz | Target date |
| `status` | text | active, completed, abandoned |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

---

### youtube_channels

Linked YouTube channels.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `channel_id` | text | YouTube channel ID |
| `title` | text | Channel name |
| `description` | text | Channel description |
| `thumbnail_url` | text | Channel thumbnail |
| `subscriber_count` | bigint | Subscriber count |
| `video_count` | bigint | Total videos |
| `view_count` | bigint | Total views |
| `custom_url` | text | Custom channel URL |
| `last_synced_at` | timestamptz | Last sync time |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_youtube_channels_channel_id` on `channel_id`

---

### youtube_videos

Video metadata synced from YouTube.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `channel_id` | uuid | Foreign key to youtube_channels |
| `video_id` | text | YouTube video ID |
| `title` | text | Video title |
| `description` | text | Video description |
| `thumbnail_url` | text | Thumbnail URL |
| `published_at` | timestamptz | Publish date |
| `duration` | interval | Video duration |
| `tags` | text[] | Video tags |
| `category_id` | text | YouTube category |
| `privacy_status` | text | public, private, unlisted |
| `view_count` | bigint | View count |
| `like_count` | bigint | Like count |
| `comment_count` | bigint | Comment count |
| `is_short` | boolean | Is YouTube Short |
| `last_synced_at` | timestamptz | Last sync time |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_youtube_videos_video_id` on `video_id`
- `idx_youtube_videos_published_at` on `(channel_id, published_at DESC)`

---

### video_analytics

Time-series analytics data per video.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `video_id` | uuid | Foreign key to youtube_videos |
| `date` | date | Analytics date |
| `views` | integer | Views on this date |
| `watch_time_minutes` | numeric | Watch time in minutes |
| `average_view_duration` | numeric | Avg view duration (seconds) |
| `average_view_percentage` | numeric | Avg % watched |
| `likes` | integer | Likes gained |
| `dislikes` | integer | Dislikes gained |
| `comments` | integer | Comments gained |
| `shares` | integer | Shares |
| `subscribers_gained` | integer | Subs gained |
| `subscribers_lost` | integer | Subs lost |
| `impressions` | integer | Impressions |
| `impressions_ctr` | numeric | Click-through rate |
| `revenue` | numeric | Estimated revenue (if available) |
| `created_at` | timestamptz | Record creation time |

**Indexes**:
- `idx_video_analytics_date` on `(video_id, date DESC)`

**Note**: Consider partitioning by date for large datasets.

---

### video_insights

AI-generated insights for videos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `video_id` | uuid | Foreign key to youtube_videos |
| `insight_type` | text | performance, audience, content, opportunity |
| `title` | text | Insight title |
| `content` | text | Detailed insight |
| `data` | jsonb | Supporting data |
| `confidence` | float | AI confidence 0-1 |
| `is_actionable` | boolean | Has clear action |
| `created_at` | timestamptz | Record creation time |

---

### youtube_comments

Sampled comments for analysis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `video_id` | uuid | Foreign key to youtube_videos |
| `comment_id` | text | YouTube comment ID |
| `author_name` | text | Commenter name |
| `author_channel_id` | text | Commenter channel |
| `text` | text | Comment text |
| `like_count` | integer | Likes on comment |
| `published_at` | timestamptz | Comment date |
| `sentiment` | text | positive, negative, neutral |
| `sentiment_score` | float | Sentiment score -1 to 1 |
| `is_question` | boolean | Contains question |
| `is_request` | boolean | Contains content request |
| `topics` | text[] | Extracted topics |
| `created_at` | timestamptz | Record creation time |

**Indexes**:
- `idx_youtube_comments_sentiment` on `(video_id, sentiment)`

---

### audience_insights

Aggregated audience patterns.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `channel_id` | uuid | Foreign key to youtube_channels |
| `insight_type` | text | request, sentiment, topic, demographic |
| `title` | text | Insight title |
| `content` | text | Detailed insight |
| `frequency` | integer | How often observed |
| `sample_comments` | jsonb | Example comments |
| `first_seen` | timestamptz | First observation |
| `last_seen` | timestamptz | Most recent |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

---

### content_ideas

Video ideas with sources and scoring.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `title` | text | Idea title |
| `description` | text | Idea description |
| `source` | text | ai_generated, audience_request, trending, creator |
| `source_reference` | text | Link to source |
| `tags` | text[] | Topic tags |
| `format` | text | long_form, short, live, series |
| `estimated_effort` | text | low, medium, high |
| `impact_score` | float | Calculated impact 0-100 |
| `status` | text | new, considering, approved, rejected, in_pipeline |
| `notes` | text | Creator notes |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_content_ideas_status` on `(creator_id, status)`
- `idx_content_ideas_impact` on `(creator_id, impact_score DESC)`

---

### content_pipeline

Videos in production.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `idea_id` | uuid | Foreign key to content_ideas (nullable) |
| `title` | text | Working title |
| `status` | text | planning, scripting, recording, editing, review, scheduled, published |
| `progress` | integer | Progress 0-100 |
| `scheduled_date` | timestamptz | Target publish date |
| `published_video_id` | uuid | Link to youtube_videos when published |
| `notes` | text | Production notes |
| `checklist` | jsonb | Production checklist |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_content_pipeline_status` on `(creator_id, status)`
- `idx_content_pipeline_scheduled` on `(creator_id, scheduled_date)`

---

### tasks

Task management.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `title` | text | Task title |
| `description` | text | Task description |
| `status` | text | pending, in_progress, completed, cancelled |
| `priority` | text | low, medium, high, urgent |
| `due_date` | timestamptz | Due date |
| `completed_at` | timestamptz | Completion time |
| `tags` | text[] | Task tags |
| `related_entity_type` | text | video, sponsorship, content, etc. |
| `related_entity_id` | uuid | Related entity ID |
| `recurrence` | jsonb | Recurrence pattern |
| `progress` | integer | Progress 0-100 |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_tasks_status` on `(creator_id, status)`
- `idx_tasks_due_date` on `(creator_id, due_date)`
- `idx_tasks_priority` on `(creator_id, priority, status)`

---

### reminders

Reminders linked to tasks or standalone.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `task_id` | uuid | Foreign key to tasks (nullable) |
| `message` | text | Reminder message |
| `remind_at` | timestamptz | Reminder time |
| `is_sent` | boolean | Notification sent |
| `sent_at` | timestamptz | When sent |
| `created_at` | timestamptz | Record creation time |

**Indexes**:
- `idx_reminders_pending` on `(remind_at, is_sent)` WHERE `is_sent = false`

---

### sponsorships

Brand deal tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `brand_name` | text | Brand/sponsor name |
| `contact_name` | text | Contact person |
| `contact_email` | text | Contact email |
| `deal_value` | numeric | Deal value |
| `currency` | text | Currency code |
| `status` | text | lead, negotiating, active, completed, cancelled |
| `contract_url` | text | Contract document link |
| `notes` | text | Deal notes |
| `pipeline_id` | uuid | Link to content_pipeline |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_sponsorships_status` on `(creator_id, status)`

---

### sponsorship_deliverables

Individual deliverables within sponsorship deals.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `sponsorship_id` | uuid | Foreign key to sponsorships |
| `description` | text | Deliverable description |
| `type` | text | dedicated_video, integration, story, post, etc. |
| `due_date` | timestamptz | Due date |
| `status` | text | pending, in_progress, completed, approved |
| `notes` | text | Notes |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

---

### conversations

Chat conversation sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `title` | text | Auto-generated title |
| `context` | jsonb | Conversation context |
| `is_archived` | boolean | Archived status |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

**Indexes**:
- `idx_conversations_creator` on `(creator_id, updated_at DESC)`

---

### messages

Chat messages within conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `conversation_id` | uuid | Foreign key to conversations |
| `role` | text | user, assistant, system, tool |
| `content` | text | Message content |
| `tool_calls` | jsonb | Tool calls made |
| `tool_results` | jsonb | Tool results |
| `tokens_used` | integer | Tokens consumed |
| `created_at` | timestamptz | Record creation time |

**Indexes**:
- `idx_messages_conversation` on `(conversation_id, created_at)`

---

### agent_memory

Vector embeddings for semantic memory.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `content` | text | Original content |
| `embedding` | vector(1536) | OpenAI embedding |
| `memory_type` | text | episodic, semantic, procedural |
| `metadata` | jsonb | Additional metadata |
| `importance` | float | Importance score 0-1 |
| `access_count` | integer | Times retrieved |
| `last_accessed` | timestamptz | Last retrieval |
| `created_at` | timestamptz | Record creation time |

**Indexes**:
- `idx_agent_memory_embedding` using ivfflat on `embedding vector_cosine_ops`
- `idx_agent_memory_type` on `(creator_id, memory_type)`

---

### workflows

Custom automation workflows.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `name` | text | Workflow name |
| `description` | text | What it does |
| `trigger_type` | text | manual, schedule, event |
| `trigger_config` | jsonb | Trigger configuration |
| `steps` | jsonb | Workflow steps |
| `is_active` | boolean | Active status |
| `last_run_at` | timestamptz | Last execution |
| `run_count` | integer | Total executions |
| `created_at` | timestamptz | Record creation time |
| `updated_at` | timestamptz | Last update time |

---

### impact_scores

Daily calculated impact scores.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `entity_type` | text | task, idea, sponsorship |
| `entity_id` | uuid | Entity ID |
| `score_date` | date | Score calculation date |
| `total_score` | float | Total impact 0-100 |
| `urgency_score` | float | Urgency component |
| `revenue_score` | float | Revenue component |
| `audience_score` | float | Audience component |
| `goal_alignment_score` | float | Goal alignment component |
| `effort_score` | float | Effort (inverse) component |
| `momentum_score` | float | Momentum component |
| `reasoning` | text | AI explanation |
| `created_at` | timestamptz | Record creation time |

**Indexes**:
- `idx_impact_scores_date` on `(creator_id, score_date, total_score DESC)`

---

### daily_briefings

Generated daily briefings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `briefing_date` | date | Briefing date |
| `greeting` | text | Personalized greeting |
| `top_priorities` | jsonb | Priority list |
| `key_metrics` | jsonb | Metrics summary |
| `opportunities` | jsonb | Opportunities |
| `warnings` | jsonb | Warnings/alerts |
| `full_content` | text | Full briefing text |
| `is_read` | boolean | Read status |
| `created_at` | timestamptz | Record creation time |

**Indexes**:
- `idx_daily_briefings_date` on `(creator_id, briefing_date DESC)`

---

### proactive_notifications

Push notification content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `type` | text | briefing, opportunity, warning, reminder |
| `title` | text | Notification title |
| `body` | text | Notification body |
| `data` | jsonb | Deep link data |
| `priority` | text | low, normal, high |
| `scheduled_for` | timestamptz | Scheduled time |
| `is_sent` | boolean | Sent status |
| `sent_at` | timestamptz | When sent |
| `created_at` | timestamptz | Record creation time |

---

### timeline_events

Unified timeline view.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | Foreign key to creators |
| `event_type` | text | video_published, task_completed, milestone, etc. |
| `title` | text | Event title |
| `description` | text | Event description |
| `event_date` | timestamptz | When it occurred |
| `related_entity_type` | text | Related entity type |
| `related_entity_id` | uuid | Related entity ID |
| `metadata` | jsonb | Additional data |
| `created_at` | timestamptz | Record creation time |

**Indexes**:
- `idx_timeline_events_date` on `(creator_id, event_date DESC)`

---

## Row-Level Security Policies

All tables implement RLS to ensure data isolation:

```sql
-- Enable RLS
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- Creator can only see their own data
CREATE POLICY "Users can view own data"
ON creators FOR SELECT
USING (user_id = auth.uid());

-- Creator can only update their own data
CREATE POLICY "Users can update own data"
ON creators FOR UPDATE
USING (user_id = auth.uid());
```

For child tables:
```sql
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (
  creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  )
);
```

---

## Vector Search

Using pgvector for semantic memory retrieval:

```sql
-- Create index for cosine similarity
CREATE INDEX idx_agent_memory_embedding
ON agent_memory
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Query similar memories
SELECT content, 1 - (embedding <=> $1) as similarity
FROM agent_memory
WHERE creator_id = $2
  AND memory_type = 'semantic'
ORDER BY embedding <=> $1
LIMIT 10;
```

---

## Triggers

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creators_updated_at
BEFORE UPDATE ON creators
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Auto-create timeline events

```sql
CREATE OR REPLACE FUNCTION create_timeline_event_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO timeline_events (creator_id, event_type, title, event_date, related_entity_type, related_entity_id)
    VALUES (NEW.creator_id, 'task_completed', NEW.title, NOW(), 'task', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Migrations

Located in `/supabase/migrations/`. Run with:

```bash
supabase db push
```

Or manually:
```bash
psql $DATABASE_URL < supabase/migrations/001_initial_schema.sql
```
