/**
 * Shared Types
 *
 * Common type definitions used by both mobile and backend.
 */

// ============ USER / CREATOR ============

export interface Creator {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  youtubeConnected: boolean;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorGoal {
  id: string;
  title: string;
  description?: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'abandoned';
}

// ============ TASKS ============

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============ CONTENT ============

export interface ContentIdea {
  id: string;
  title: string;
  description?: string;
  source: IdeaSource;
  tags: string[];
  format: ContentFormat;
  estimatedEffort: EffortLevel;
  impactScore?: number;
  status: IdeaStatus;
  createdAt: string;
}

export type IdeaSource = 'ai_generated' | 'audience_request' | 'trending' | 'creator';
export type ContentFormat = 'long_form' | 'short' | 'live' | 'series';
export type EffortLevel = 'low' | 'medium' | 'high';
export type IdeaStatus = 'new' | 'considering' | 'approved' | 'rejected' | 'in_pipeline';

export interface PipelineItem {
  id: string;
  title: string;
  status: PipelineStatus;
  progress: number;
  scheduledDate?: string;
  ideaId?: string;
  publishedVideoId?: string;
}

export type PipelineStatus = 'planning' | 'scripting' | 'recording' | 'editing' | 'review' | 'scheduled' | 'published';

// ============ YOUTUBE ============

export interface YouTubeChannel {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  lastSyncedAt: string;
}

export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isShort: boolean;
}

// ============ SPONSORSHIPS ============

export interface Sponsorship {
  id: string;
  brandName: string;
  contactName?: string;
  contactEmail?: string;
  dealValue?: number;
  currency: string;
  status: SponsorshipStatus;
  createdAt: string;
}

export type SponsorshipStatus = 'lead' | 'negotiating' | 'active' | 'completed' | 'cancelled';

// ============ CHAT ============

export interface Conversation {
  id: string;
  title?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  createdAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ToolCall {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
}

// ============ IMPACT SCORES ============

export interface ImpactScore {
  id: string;
  entityType: 'task' | 'idea' | 'sponsorship';
  entityId: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  reasoning: string;
  scoreDate: string;
}

export interface ScoreBreakdown {
  urgency: number;
  revenue: number;
  audience: number;
  goalAlignment: number;
  effort: number;
  momentum: number;
}

// ============ BRIEFING ============

export interface DailyBriefing {
  id: string;
  briefingDate: string;
  greeting: string;
  topPriorities: BriefingPriority[];
  keyMetrics: BriefingMetrics;
  opportunities: BriefingOpportunity[];
  warnings: BriefingWarning[];
  isRead: boolean;
}

export interface BriefingPriority {
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  impactScore: number;
}

export interface BriefingMetrics {
  subscriberChange: number;
  viewsLast7Days: number;
  viewsChange: number;
  topVideo?: string;
  engagementRate: number;
}

export interface BriefingOpportunity {
  title: string;
  description: string;
  potentialImpact: string;
}

export interface BriefingWarning {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============ STREAM EVENTS ============

export interface StreamEvent {
  type: 'message_start' | 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  id?: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  conversationId?: string;
  messageId?: string;
}
