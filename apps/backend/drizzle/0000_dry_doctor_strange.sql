CREATE TABLE "agent_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"content" text NOT NULL,
	"memory_type" text,
	"metadata" jsonb,
	"importance" real DEFAULT 0.5,
	"access_count" integer DEFAULT 0,
	"last_accessed" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source" text,
	"source_reference" text,
	"tags" jsonb,
	"format" text,
	"estimated_effort" text,
	"impact_score" real,
	"status" text DEFAULT 'new',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_pipeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"idea_id" uuid,
	"title" text NOT NULL,
	"status" text DEFAULT 'planning',
	"progress" integer DEFAULT 0,
	"scheduled_date" timestamp,
	"published_video_id" uuid,
	"notes" text,
	"checklist" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text,
	"context" jsonb,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"goal_type" text,
	"target_value" numeric,
	"current_value" numeric,
	"unit" text,
	"deadline" timestamp,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"category" text,
	"confidence" real DEFAULT 0.8,
	"source" text,
	"last_confirmed" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"youtube_connected" boolean DEFAULT false,
	"youtube_refresh_token" text,
	"youtube_token_expires_at" timestamp,
	"timezone" text DEFAULT 'UTC',
	"onboarding_completed" boolean DEFAULT false,
	"notification_preferences" jsonb,
	"expo_push_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "creators_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "daily_briefings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"briefing_date" date NOT NULL,
	"greeting" text,
	"top_priorities" jsonb,
	"key_metrics" jsonb,
	"opportunities" jsonb,
	"warnings" jsonb,
	"full_content" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "impact_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"score_date" date NOT NULL,
	"total_score" real,
	"urgency_score" real,
	"revenue_score" real,
	"audience_score" real,
	"goal_alignment_score" real,
	"effort_score" real,
	"momentum_score" real,
	"reasoning" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tool_calls" jsonb,
	"tool_results" jsonb,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"brand_name" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"deal_value" numeric,
	"currency" text DEFAULT 'USD',
	"status" text DEFAULT 'lead',
	"contract_url" text,
	"notes" text,
	"pipeline_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"due_date" timestamp,
	"completed_at" timestamp,
	"tags" jsonb,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "youtube_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"channel_id" text NOT NULL,
	"title" text,
	"description" text,
	"thumbnail_url" text,
	"subscriber_count" integer,
	"video_count" integer,
	"view_count" integer,
	"custom_url" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "youtube_channels_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "youtube_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"video_id" text NOT NULL,
	"title" text,
	"description" text,
	"thumbnail_url" text,
	"published_at" timestamp,
	"duration" text,
	"tags" jsonb,
	"category_id" text,
	"privacy_status" text,
	"view_count" integer,
	"like_count" integer,
	"comment_count" integer,
	"is_short" boolean DEFAULT false,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "youtube_videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
ALTER TABLE "agent_memory" ADD CONSTRAINT "agent_memory_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_pipeline" ADD CONSTRAINT "content_pipeline_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_pipeline" ADD CONSTRAINT "content_pipeline_idea_id_content_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."content_ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_goals" ADD CONSTRAINT "creator_goals_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_memory" ADD CONSTRAINT "creator_memory_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_briefings" ADD CONSTRAINT "daily_briefings_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_scores" ADD CONSTRAINT "impact_scores_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_channels" ADD CONSTRAINT "youtube_channels_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_videos" ADD CONSTRAINT "youtube_videos_channel_id_youtube_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."youtube_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_creators_user_id" ON "creators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("creator_id","status");--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "tasks" USING btree ("creator_id","due_date");