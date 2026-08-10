-- Agentic Creator OS - Initial Database Schema
-- This migration creates all tables for the creator operating system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- CREATOR CORE
-- ============================================

-- Creators table (extends Supabase auth.users)
CREATE TABLE creators (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    youtube_connected BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{
        "daily_briefing": true,
        "deadline_reminders": true,
        "performance_alerts": true,
        "opportunity_alerts": true
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator memory (semantic key-value store)
CREATE TABLE creator_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT NOT NULL, -- 'preference', 'style', 'workflow', 'goal', 'constraint'
    confidence FLOAT DEFAULT 1.0,
    source TEXT, -- 'explicit', 'inferred', 'learned'
    last_confirmed_at TIMESTAMPTZ,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, key)
);

-- Creator goals
CREATE TABLE creator_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL, -- 'subscriber', 'revenue', 'content', 'engagement', 'custom'
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    target_date DATE,
    status TEXT DEFAULT 'active', -- 'active', 'achieved', 'paused', 'abandoned'
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- YOUTUBE KNOWLEDGE
-- ============================================

-- YouTube channels
CREATE TABLE youtube_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    custom_url TEXT,
    thumbnail_url TEXT,
    subscriber_count BIGINT DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    access_token TEXT, -- Encrypted via Supabase Vault
    refresh_token TEXT, -- Encrypted via Supabase Vault
    token_expires_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- YouTube videos
CREATE TABLE youtube_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    published_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    tags TEXT[],
    category_id TEXT,
    privacy_status TEXT, -- 'public', 'private', 'unlisted'
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    is_short BOOLEAN DEFAULT FALSE,
    embedding VECTOR(1536), -- For semantic search
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video analytics (time-series)
CREATE TABLE video_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    watch_time_minutes NUMERIC DEFAULT 0,
    average_view_duration_seconds NUMERIC DEFAULT 0,
    average_view_percentage NUMERIC DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    subscribers_gained INTEGER DEFAULT 0,
    subscribers_lost INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    impression_click_through_rate NUMERIC DEFAULT 0,
    revenue NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, date)
);

-- AI-generated video insights
CREATE TABLE video_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'performance', 'audience', 'optimization', 'pattern'
    insight TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.8,
    data_points JSONB,
    actionable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- YouTube comments (sampled)
CREATE TABLE youtube_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
    comment_id TEXT NOT NULL UNIQUE,
    author_name TEXT,
    author_channel_id TEXT,
    text TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    sentiment TEXT, -- 'positive', 'negative', 'neutral'
    sentiment_score FLOAT,
    is_question BOOLEAN DEFAULT FALSE,
    is_request BOOLEAN DEFAULT FALSE,
    topics TEXT[],
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audience insights (aggregated)
CREATE TABLE audience_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'topic_request', 'sentiment_trend', 'engagement_pattern', 'demographic'
    title TEXT NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    relevance_score FLOAT DEFAULT 0.5,
    video_references UUID[], -- Array of video IDs
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ============================================
-- CONTENT PIPELINE
-- ============================================

-- Content ideas
CREATE TABLE content_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL, -- 'ai_generated', 'user_created', 'comment_extracted', 'trend'
    source_reference TEXT, -- URL or comment ID
    format TEXT DEFAULT 'long_form', -- 'long_form', 'short', 'live', 'podcast'
    status TEXT DEFAULT 'new', -- 'new', 'saved', 'in_pipeline', 'rejected'
    tags TEXT[],
    estimated_effort INTEGER, -- 1-10 scale
    potential_impact FLOAT, -- 0-1 score
    impact_reasoning TEXT,
    notes TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content pipeline (videos in production)
CREATE TABLE content_pipeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    format TEXT DEFAULT 'long_form',
    status TEXT DEFAULT 'planning', -- 'planning', 'scripting', 'filming', 'editing', 'thumbnail', 'scheduled', 'published'
    target_publish_date DATE,
    actual_publish_date DATE,
    youtube_video_id UUID REFERENCES youtube_videos(id) ON DELETE SET NULL,
    script_url TEXT,
    footage_status TEXT, -- 'not_started', 'filming', 'completed'
    edit_status TEXT, -- 'not_started', 'rough_cut', 'fine_cut', 'completed'
    thumbnail_status TEXT, -- 'not_started', 'in_progress', 'completed'
    notes TEXT,
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority INTEGER DEFAULT 5, -- 1-10
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    category TEXT, -- 'content', 'sponsorship', 'admin', 'growth', 'engagement'
    related_pipeline_id UUID REFERENCES content_pipeline(id) ON DELETE SET NULL,
    related_sponsorship_id UUID REFERENCES sponsorships(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- For subtasks
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    remind_at TIMESTAMPTZ NOT NULL,
    reminder_type TEXT DEFAULT 'one_time', -- 'one_time', 'recurring'
    recurrence_rule TEXT, -- iCal RRULE format
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'dismissed'
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUSINESS (SPONSORSHIPS)
-- ============================================

-- Sponsorships
CREATE TABLE sponsorships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'negotiating', -- 'lead', 'negotiating', 'contracted', 'in_progress', 'completed', 'cancelled'
    deal_type TEXT, -- 'integration', 'dedicated', 'affiliate', 'ambassador'
    deal_value NUMERIC,
    currency TEXT DEFAULT 'USD',
    start_date DATE,
    end_date DATE,
    contract_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorship deliverables
CREATE TABLE sponsorship_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsorship_id UUID NOT NULL REFERENCES sponsorships(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deliverable_type TEXT NOT NULL, -- 'video_integration', 'dedicated_video', 'social_post', 'story', 'other'
    due_date DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'revision_requested', 'approved'
    pipeline_id UUID REFERENCES content_pipeline(id) ON DELETE SET NULL,
    submission_url TEXT,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENT SYSTEM
-- ============================================

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title TEXT,
    summary TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    content TEXT NOT NULL,
    tool_calls JSONB, -- For assistant messages with tool calls
    tool_call_id TEXT, -- For tool response messages
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent memory (vector embeddings for semantic search)
CREATE TABLE agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL, -- 'episodic', 'semantic', 'procedural'
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    importance FLOAT DEFAULT 0.5, -- 0-1
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Custom workflows
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL, -- 'manual', 'scheduled', 'event', 'condition'
    trigger_config JSONB,
    steps JSONB NOT NULL, -- Array of workflow steps
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impact scores (daily recommendations)
CREATE TABLE impact_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    item_type TEXT NOT NULL, -- 'task', 'idea', 'pipeline', 'sponsorship', 'action'
    item_id UUID, -- References the relevant table
    action_description TEXT NOT NULL,
    total_score FLOAT NOT NULL,
    urgency_score FLOAT DEFAULT 0,
    revenue_score FLOAT DEFAULT 0,
    audience_score FLOAT DEFAULT 0,
    goal_alignment_score FLOAT DEFAULT 0,
    effort_score FLOAT DEFAULT 0,
    momentum_score FLOAT DEFAULT 0,
    reasoning TEXT,
    is_top_recommendation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, date, item_type, item_id)
);

-- Daily briefings
CREATE TABLE daily_briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    briefing_content TEXT NOT NULL,
    top_priorities JSONB, -- Array of priority items
    key_metrics JSONB, -- Yesterday's performance
    opportunities JSONB, -- Identified opportunities
    warnings JSONB, -- Things needing attention
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    UNIQUE(creator_id, date)
);

-- Proactive notifications
CREATE TABLE proactive_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'opportunity', 'warning', 'milestone', 'reminder', 'insight'
    title TEXT NOT NULL,
    body TEXT,
    data JSONB, -- Additional data for the app to use
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'read', 'dismissed'
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline events (unified view)
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'video_published', 'task_completed', 'milestone', 'sponsorship', 'insight', 'metric'
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    related_type TEXT, -- 'video', 'task', 'sponsorship', 'goal', etc.
    related_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Creator memory
CREATE INDEX idx_creator_memory_creator ON creator_memory(creator_id);
CREATE INDEX idx_creator_memory_category ON creator_memory(creator_id, category);
CREATE INDEX idx_creator_memory_embedding ON creator_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- YouTube
CREATE INDEX idx_youtube_channels_creator ON youtube_channels(creator_id);
CREATE INDEX idx_youtube_videos_channel ON youtube_videos(channel_id);
CREATE INDEX idx_youtube_videos_published ON youtube_videos(published_at DESC);
CREATE INDEX idx_youtube_videos_embedding ON youtube_videos USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_video_analytics_video_date ON video_analytics(video_id, date DESC);
CREATE INDEX idx_youtube_comments_video ON youtube_comments(video_id);
CREATE INDEX idx_youtube_comments_embedding ON youtube_comments USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Content
CREATE INDEX idx_content_ideas_creator ON content_ideas(creator_id);
CREATE INDEX idx_content_ideas_status ON content_ideas(creator_id, status);
CREATE INDEX idx_content_ideas_embedding ON content_ideas USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_content_pipeline_creator ON content_pipeline(creator_id);
CREATE INDEX idx_content_pipeline_status ON content_pipeline(creator_id, status);

-- Tasks
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_status ON tasks(creator_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(creator_id, due_date) WHERE status = 'pending';
CREATE INDEX idx_reminders_creator ON reminders(creator_id);
CREATE INDEX idx_reminders_remind_at ON reminders(remind_at) WHERE status = 'pending';

-- Sponsorships
CREATE INDEX idx_sponsorships_creator ON sponsorships(creator_id);
CREATE INDEX idx_sponsorships_status ON sponsorships(creator_id, status);
CREATE INDEX idx_sponsorship_deliverables_sponsorship ON sponsorship_deliverables(sponsorship_id);
CREATE INDEX idx_sponsorship_deliverables_due ON sponsorship_deliverables(due_date) WHERE status != 'approved';

-- Agent
CREATE INDEX idx_conversations_creator ON conversations(creator_id);
CREATE INDEX idx_conversations_last_message ON conversations(creator_id, last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at);
CREATE INDEX idx_agent_memory_creator ON agent_memory(creator_id);
CREATE INDEX idx_agent_memory_type ON agent_memory(creator_id, memory_type);
CREATE INDEX idx_agent_memory_embedding ON agent_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_impact_scores_creator_date ON impact_scores(creator_id, date DESC);
CREATE INDEX idx_impact_scores_top ON impact_scores(creator_id, date, is_top_recommendation) WHERE is_top_recommendation = TRUE;
CREATE INDEX idx_proactive_notifications_creator ON proactive_notifications(creator_id);
CREATE INDEX idx_proactive_notifications_pending ON proactive_notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_timeline_events_creator ON timeline_events(creator_id);
CREATE INDEX idx_timeline_events_date ON timeline_events(creator_id, event_date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Creator policies (users can only access their own data)
CREATE POLICY creators_policy ON creators FOR ALL USING (auth.uid() = id);
CREATE POLICY creator_memory_policy ON creator_memory FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY creator_goals_policy ON creator_goals FOR ALL USING (auth.uid() = creator_id);

-- YouTube policies
CREATE POLICY youtube_channels_policy ON youtube_channels FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY youtube_videos_policy ON youtube_videos FOR ALL
    USING (channel_id IN (SELECT id FROM youtube_channels WHERE creator_id = auth.uid()));
CREATE POLICY video_analytics_policy ON video_analytics FOR ALL
    USING (video_id IN (SELECT id FROM youtube_videos WHERE channel_id IN (SELECT id FROM youtube_channels WHERE creator_id = auth.uid())));
CREATE POLICY video_insights_policy ON video_insights FOR ALL
    USING (video_id IN (SELECT id FROM youtube_videos WHERE channel_id IN (SELECT id FROM youtube_channels WHERE creator_id = auth.uid())));
CREATE POLICY youtube_comments_policy ON youtube_comments FOR ALL
    USING (video_id IN (SELECT id FROM youtube_videos WHERE channel_id IN (SELECT id FROM youtube_channels WHERE creator_id = auth.uid())));
CREATE POLICY audience_insights_policy ON audience_insights FOR ALL
    USING (channel_id IN (SELECT id FROM youtube_channels WHERE creator_id = auth.uid()));

-- Content policies
CREATE POLICY content_ideas_policy ON content_ideas FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY content_pipeline_policy ON content_pipeline FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY tasks_policy ON tasks FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY reminders_policy ON reminders FOR ALL USING (auth.uid() = creator_id);

-- Business policies
CREATE POLICY sponsorships_policy ON sponsorships FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY sponsorship_deliverables_policy ON sponsorship_deliverables FOR ALL
    USING (sponsorship_id IN (SELECT id FROM sponsorships WHERE creator_id = auth.uid()));

-- Agent policies
CREATE POLICY conversations_policy ON conversations FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY messages_policy ON messages FOR ALL
    USING (conversation_id IN (SELECT id FROM conversations WHERE creator_id = auth.uid()));
CREATE POLICY agent_memory_policy ON agent_memory FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY workflows_policy ON workflows FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY impact_scores_policy ON impact_scores FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY daily_briefings_policy ON daily_briefings FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY proactive_notifications_policy ON proactive_notifications FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY timeline_events_policy ON timeline_events FOR ALL USING (auth.uid() = creator_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_memory_updated_at BEFORE UPDATE ON creator_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_goals_updated_at BEFORE UPDATE ON creator_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_youtube_channels_updated_at BEFORE UPDATE ON youtube_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_youtube_videos_updated_at BEFORE UPDATE ON youtube_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_ideas_updated_at BEFORE UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_pipeline_updated_at BEFORE UPDATE ON content_pipeline FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sponsorships_updated_at BEFORE UPDATE ON sponsorships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sponsorship_deliverables_updated_at BEFORE UPDATE ON sponsorship_deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create creator profile after auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO creators (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function for semantic memory search
CREATE OR REPLACE FUNCTION search_agent_memory(
    p_creator_id UUID,
    p_embedding VECTOR(1536),
    p_memory_type TEXT DEFAULT NULL,
    p_limit INT DEFAULT 10,
    p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    memory_type TEXT,
    content TEXT,
    importance FLOAT,
    similarity FLOAT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        am.id,
        am.memory_type,
        am.content,
        am.importance,
        1 - (am.embedding <=> p_embedding) AS similarity,
        am.created_at
    FROM agent_memory am
    WHERE am.creator_id = p_creator_id
        AND (p_memory_type IS NULL OR am.memory_type = p_memory_type)
        AND 1 - (am.embedding <=> p_embedding) > p_threshold
    ORDER BY am.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate impact score
CREATE OR REPLACE FUNCTION calculate_impact_score(
    p_urgency FLOAT,      -- 0-1, deadline proximity
    p_revenue FLOAT,      -- 0-1, revenue impact
    p_audience FLOAT,     -- 0-1, audience impact
    p_goal_alignment FLOAT, -- 0-1, alignment with goals
    p_effort FLOAT,       -- 0-1, effort required (will be inverted)
    p_momentum FLOAT      -- 0-1, momentum factor
)
RETURNS FLOAT AS $$
BEGIN
    -- Weights: urgency 25%, revenue 20%, audience 20%, goal 15%, effort 10%, momentum 10%
    RETURN (
        p_urgency * 0.25 +
        p_revenue * 0.20 +
        p_audience * 0.20 +
        p_goal_alignment * 0.15 +
        (1 - p_effort) * 0.10 +  -- Invert effort so low effort = high score
        p_momentum * 0.10
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation messages with context window
CREATE OR REPLACE FUNCTION get_conversation_context(
    p_conversation_id UUID,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    role TEXT,
    content TEXT,
    tool_calls JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.role, m.content, m.tool_calls, m.created_at
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE proactive_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE content_pipeline;
