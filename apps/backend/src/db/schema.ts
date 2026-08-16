/**
 * Database Schema (Drizzle ORM)
 *
 * Type-safe schema definition for PostgreSQL.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  date,
  index,
  uniqueIndex,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ CREATOR CORE ============

export const creators = pgTable('creators', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  youtubeConnected: boolean('youtube_connected').default(false),
  youtubeAccessToken: text('youtube_access_token'),
  youtubeRefreshToken: text('youtube_refresh_token'),
  youtubeTokenExpiresAt: timestamp('youtube_token_expires_at'),
  timezone: text('timezone').default('UTC'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  notificationPreferences: jsonb('notification_preferences'),
  expoPushToken: text('expo_push_token'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_creators_user_id').on(table.userId),
}));

export const creatorMemory = pgTable('creator_memory', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  category: text('category'),
  confidence: real('confidence').default(0.8),
  source: text('source'),
  lastConfirmed: timestamp('last_confirmed'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const creatorGoals = pgTable('creator_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  title: text('title').notNull(),
  description: text('description'),
  goalType: text('goal_type'),
  targetValue: numeric('target_value'),
  currentValue: numeric('current_value'),
  unit: text('unit'),
  deadline: timestamp('deadline'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ YOUTUBE ============

export const youtubeChannels = pgTable('youtube_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  channelId: text('channel_id').notNull().unique(),
  title: text('title'),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  subscriberCount: integer('subscriber_count'),
  videoCount: integer('video_count'),
  viewCount: integer('view_count'),
  customUrl: text('custom_url'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const youtubeVideos = pgTable('youtube_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').notNull().references(() => youtubeChannels.id),
  videoId: text('video_id').notNull().unique(),
  title: text('title'),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  publishedAt: timestamp('published_at'),
  duration: text('duration'),
  tags: jsonb('tags'),
  categoryId: text('category_id'),
  privacyStatus: text('privacy_status'),
  viewCount: integer('view_count'),
  likeCount: integer('like_count'),
  commentCount: integer('comment_count'),
  isShort: boolean('is_short').default(false),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const videoAnalytics = pgTable('video_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').notNull().references(() => youtubeVideos.id),
  date: date('date').notNull(),
  views: integer('views').default(0),
  watchTimeMinutes: integer('watch_time_minutes').default(0),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  subscribersGained: integer('subscribers_gained').default(0),
  ctr: real('ctr'),
  avgViewDuration: real('avg_view_duration'),
  avgViewPercentage: real('avg_view_percentage'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  videoDateIdx: uniqueIndex('idx_video_analytics_video_date').on(table.videoId, table.date),
}));

export const youtubeComments = pgTable('youtube_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').notNull().references(() => youtubeVideos.id),
  commentId: text('comment_id').notNull().unique(),
  authorName: text('author_name'),
  text: text('text').notNull(),
  likeCount: integer('like_count').default(0),
  replyCount: integer('reply_count').default(0),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  videoIdIdx: index('idx_youtube_comments_video_id').on(table.videoId),
}));

// ============ TASKS ============

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  priority: text('priority').default('medium'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  reminderAt: timestamp('reminder_at'),
  tags: jsonb('tags'),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  progress: integer('progress').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  statusIdx: index('idx_tasks_status').on(table.creatorId, table.status),
  dueDateIdx: index('idx_tasks_due_date').on(table.creatorId, table.dueDate),
}));

// ============ CONTENT ============

export const contentIdeas = pgTable('content_ideas', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  title: text('title').notNull(),
  description: text('description'),
  source: text('source'),
  sourceReference: text('source_reference'),
  tags: jsonb('tags'),
  format: text('format'),
  estimatedEffort: text('estimated_effort'),
  impactScore: real('impact_score'),
  status: text('status').default('new'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contentPipeline = pgTable('content_pipeline', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  ideaId: uuid('idea_id').references(() => contentIdeas.id),
  title: text('title').notNull(),
  status: text('status').default('planning'),
  progress: integer('progress').default(0),
  scheduledDate: timestamp('scheduled_date'),
  publishedVideoId: uuid('published_video_id'),
  notes: text('notes'),
  checklist: jsonb('checklist'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ SPONSORSHIPS ============

export const sponsorships = pgTable('sponsorships', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  brandName: text('brand_name').notNull(),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  dealValue: numeric('deal_value'),
  currency: text('currency').default('USD'),
  status: text('status').default('lead'),
  contractUrl: text('contract_url'),
  notes: text('notes'),
  pipelineId: uuid('pipeline_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sponsorshipDeliverables = pgTable('sponsorship_deliverables', {
  id: uuid('id').defaultRandom().primaryKey(),
  sponsorshipId: uuid('sponsorship_id').notNull().references(() => sponsorships.id),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type'),
  dueDate: timestamp('due_date'),
  status: text('status').default('pending'),
  linkedVideoId: uuid('linked_video_id').references(() => youtubeVideos.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ CONVERSATIONS ============

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  title: text('title'),
  context: jsonb('context'),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolCalls: jsonb('tool_calls'),
  toolResults: jsonb('tool_results'),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============ AGENT MEMORY ============

export const agentMemory = pgTable('agent_memory', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  content: text('content').notNull(),
  // Note: embedding vector handled via raw SQL for pgvector
  memoryType: text('memory_type'),
  metadata: jsonb('metadata'),
  importance: real('importance').default(0.5),
  accessCount: integer('access_count').default(0),
  lastAccessed: timestamp('last_accessed'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============ IMPACT SCORES ============

export const impactScores = pgTable('impact_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  scoreDate: date('score_date').notNull(),
  totalScore: real('total_score'),
  urgencyScore: real('urgency_score'),
  revenueScore: real('revenue_score'),
  audienceScore: real('audience_score'),
  goalAlignmentScore: real('goal_alignment_score'),
  effortScore: real('effort_score'),
  momentumScore: real('momentum_score'),
  reasoning: text('reasoning'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============ BRIEFINGS ============

export const dailyBriefings = pgTable('daily_briefings', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  briefingDate: date('briefing_date').notNull(),
  greeting: text('greeting'),
  topPriorities: jsonb('top_priorities'),
  keyMetrics: jsonb('key_metrics'),
  opportunities: jsonb('opportunities'),
  warnings: jsonb('warnings'),
  fullContent: text('full_content'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============ NOTIFICATIONS ============

export const proactiveNotifications = pgTable('proactive_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: jsonb('data'),
  sentAt: timestamp('sent_at').defaultNow(),
  readAt: timestamp('read_at'),
}, (table) => ({
  creatorIdIdx: index('idx_proactive_notifications_creator_id').on(table.creatorId),
}));

// ============ RELATIONS ============

export const creatorsRelations = relations(creators, ({ many }) => ({
  goals: many(creatorGoals),
  memory: many(creatorMemory),
  channels: many(youtubeChannels),
  tasks: many(tasks),
  ideas: many(contentIdeas),
  sponsorships: many(sponsorships),
  conversations: many(conversations),
}));

export const youtubeChannelsRelations = relations(youtubeChannels, ({ one, many }) => ({
  creator: one(creators, {
    fields: [youtubeChannels.creatorId],
    references: [creators.id],
  }),
  videos: many(youtubeVideos),
}));

export const youtubeVideosRelations = relations(youtubeVideos, ({ one, many }) => ({
  channel: one(youtubeChannels, {
    fields: [youtubeVideos.channelId],
    references: [youtubeChannels.id],
  }),
  analytics: many(videoAnalytics),
  comments: many(youtubeComments),
}));

export const youtubeCommentsRelations = relations(youtubeComments, ({ one }) => ({
  video: one(youtubeVideos, {
    fields: [youtubeComments.videoId],
    references: [youtubeVideos.id],
  }),
}));

export const videoAnalyticsRelations = relations(videoAnalytics, ({ one }) => ({
  video: one(youtubeVideos, {
    fields: [videoAnalytics.videoId],
    references: [youtubeVideos.id],
  }),
}));

export const sponsorshipsRelations = relations(sponsorships, ({ one, many }) => ({
  creator: one(creators, {
    fields: [sponsorships.creatorId],
    references: [creators.id],
  }),
  deliverables: many(sponsorshipDeliverables),
}));

export const sponsorshipDeliverablesRelations = relations(sponsorshipDeliverables, ({ one }) => ({
  sponsorship: one(sponsorships, {
    fields: [sponsorshipDeliverables.sponsorshipId],
    references: [sponsorships.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  creator: one(creators, {
    fields: [conversations.creatorId],
    references: [creators.id],
  }),
  messages: many(messages),
}));
