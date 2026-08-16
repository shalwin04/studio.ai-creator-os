/**
 * Backend API Client
 *
 * Talks to the Fastify backend (apps/backend) instead of Supabase directly.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const ACCESS_TOKEN_KEY = 'backend_access_token';
const REFRESH_TOKEN_KEY = 'backend_refresh_token';

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // best-effort
  }
}

async function storageRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // best-effort
  }
}

export interface BackendCreator {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string;
  onboardingCompleted: boolean;
  youtubeConnected: boolean;
  notificationPreferences: {
    daily_briefing: boolean;
    deadline_reminders: boolean;
    performance_alerts: boolean;
    opportunity_alerts: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_NOTIFICATION_PREFERENCES = {
  daily_briefing: true,
  deadline_reminders: true,
  performance_alerts: true,
  opportunity_alerts: true,
};

// Adapts the backend's camelCase creator shape to the snake_case `Creator`
// type the existing store/screens already expect (see src/services/supabase.ts).
export function mapCreator(creator: BackendCreator) {
  return {
    id: creator.id,
    email: creator.email,
    display_name: creator.displayName,
    avatar_url: creator.avatarUrl,
    timezone: creator.timezone,
    onboarding_completed: creator.onboardingCompleted,
    youtube_connected: creator.youtubeConnected,
    notification_preferences: creator.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
    created_at: creator.createdAt,
    updated_at: creator.updatedAt,
  };
}

async function apiFetch(path: string, options: RequestInit = {}, withAuth = true): Promise<Response> {
  const headers = new Headers(options.headers);
  // Fastify's JSON body parser rejects a request that declares this content
  // type but sends no body (e.g. POST /logout), so only set it when there's
  // actually a body to send.
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (withAuth) {
    const token = await storageGet(ACCESS_TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ session: Session; creator: BackendCreator }> {
  const resp = await apiFetch(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false
  );

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Login failed');
  }

  await storageSet(ACCESS_TOKEN_KEY, data.session.access_token);
  await storageSet(REFRESH_TOKEN_KEY, data.session.refresh_token);

  return { session: data.session as Session, creator: data.creator as BackendCreator };
}

export async function apiRegister(
  email: string,
  password: string,
  displayName?: string
): Promise<{ session: Session | null; creator: BackendCreator }> {
  const resp = await apiFetch(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password, displayName }) },
    false
  );

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  // Supabase requires email confirmation on this project, so `session` is
  // null until the user clicks the confirmation link.
  if (data.session) {
    await storageSet(ACCESS_TOKEN_KEY, data.session.access_token);
    await storageSet(REFRESH_TOKEN_KEY, data.session.refresh_token);
  }

  return { session: data.session as Session | null, creator: data.creator as BackendCreator };
}

export async function apiGetMe(): Promise<BackendCreator> {
  const resp = await apiFetch('/api/auth/me');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load profile');
  }

  return data.creator as BackendCreator;
}

export interface BackendYoutubeChannel {
  id: string;
  creatorId: string;
  channelId: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
  customUrl: string | null;
  lastSyncedAt: string | null;
}

export interface BackendYoutubeVideo {
  id: string;
  channelId: string;
  videoId: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  duration: string | null;
  categoryId: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  isShort: boolean | null;
}

export interface BackendChannelAnalyticsPoint {
  date: string;
  views: number;
  watchTimeMinutes: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
}

export interface BackendVideoAnalyticsPoint {
  id: string;
  videoId: string;
  date: string;
  views: number | null;
  watchTimeMinutes: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  subscribersGained: number | null;
  ctr: number | null;
  avgViewDuration: number | null;
  avgViewPercentage: number | null;
}

export async function apiGetYoutubeConnectUrl(redirectTo?: string): Promise<string> {
  const resp = await apiFetch('/api/auth/youtube/connect', {
    method: 'POST',
    body: JSON.stringify(redirectTo ? { redirectTo } : {}),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to start YouTube connection');
  }

  return data.url as string;
}

export async function apiGetYoutubeChannel(): Promise<BackendYoutubeChannel | null> {
  const resp = await apiFetch('/api/youtube/channel');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load channel');
  }

  return (data.channel as BackendYoutubeChannel | null) ?? null;
}

export async function apiGetYoutubeVideos(): Promise<BackendYoutubeVideo[]> {
  const resp = await apiFetch('/api/youtube/videos');
  const data = await resp.json();

  if (!resp.ok) {
    // Not connected yet is a normal state, not an error worth throwing on.
    if (resp.status === 404) return [];
    throw new Error(data.message || 'Failed to load videos');
  }

  return data.videos as BackendYoutubeVideo[];
}

export async function apiGetYoutubeVideo(id: string): Promise<BackendYoutubeVideo | null> {
  const resp = await apiFetch(`/api/youtube/videos/${id}`);
  const data = await resp.json();

  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(data.message || 'Failed to load video');
  }

  return data.video as BackendYoutubeVideo;
}

export async function apiGetYoutubeVideoAnalytics(id: string): Promise<BackendVideoAnalyticsPoint[]> {
  const resp = await apiFetch(`/api/youtube/videos/${id}/analytics`);
  const data = await resp.json();

  if (!resp.ok) {
    if (resp.status === 404) return [];
    throw new Error(data.message || 'Failed to load video analytics');
  }

  return data.analytics as BackendVideoAnalyticsPoint[];
}

export async function apiGetYoutubeAnalytics(): Promise<BackendChannelAnalyticsPoint[]> {
  const resp = await apiFetch('/api/youtube/analytics');
  const data = await resp.json();

  if (!resp.ok) {
    if (resp.status === 404) return [];
    throw new Error(data.message || 'Failed to load analytics');
  }

  return data.analytics as BackendChannelAnalyticsPoint[];
}

export async function apiSyncYoutube(fullSync = false): Promise<void> {
  const resp = await apiFetch('/api/youtube/sync', {
    method: 'POST',
    body: JSON.stringify({ fullSync }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'YouTube sync failed');
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // best-effort — clear local tokens regardless
  }
  await storageRemove(ACCESS_TOKEN_KEY);
  await storageRemove(REFRESH_TOKEN_KEY);
}

// ============================================
// RECOMMENDATIONS API
// ============================================

export interface BackendRecommendation {
  type: 'task' | 'content' | 'sponsorship' | 'insight';
  title: string;
  description: string;
  score: number;
  urgency: number;
  revenueImpact: number;
  audienceImpact: number;
  effort: number;
  linkedId?: string;
  action?: string;
}

export async function apiGetRecommendations(): Promise<BackendRecommendation[]> {
  const resp = await apiFetch('/api/recommendations');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load recommendations');
  }

  return data.recommendations as BackendRecommendation[];
}

export async function apiGetTopRecommendation(): Promise<BackendRecommendation | null> {
  const resp = await apiFetch('/api/recommendations/top');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load top recommendation');
  }

  return data.recommendation as BackendRecommendation | null;
}

// ============================================
// BRIEFING API
// ============================================

export interface BackendPerformanceMetrics {
  viewsChange: number;
  watchTimeChange: number;
  subscriberChange: number;
  topPerformingVideo?: { title: string; views: number };
  comparedToPrevious: 'up' | 'down' | 'stable';
}

export interface BackendOpportunity {
  type: 'trend' | 'content_gap' | 'engagement' | 'timing';
  title: string;
  description: string;
  potentialImpact: 'high' | 'medium' | 'low';
}

export interface BackendRisk {
  type: 'deadline' | 'engagement_drop' | 'sponsor' | 'content_gap';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  dueDate?: string;
}

export interface BackendBriefing {
  id: string;
  creatorId: string;
  date: string;
  greeting: string;
  summary: string;
  priorities: string[];
  insights: string[];
  metrics: BackendPerformanceMetrics;
  opportunities: BackendOpportunity[];
  risks: BackendRisk[];
  isRead: boolean;
  createdAt: string;
}

export async function apiGetPerformanceMetrics(): Promise<BackendPerformanceMetrics> {
  const resp = await apiFetch('/api/briefing/performance');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load performance metrics');
  }

  return data.metrics as BackendPerformanceMetrics;
}

export async function apiGetOpportunities(): Promise<BackendOpportunity[]> {
  const resp = await apiFetch('/api/briefing/opportunities');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load opportunities');
  }

  return data.opportunities as BackendOpportunity[];
}

export async function apiGetRisks(): Promise<BackendRisk[]> {
  const resp = await apiFetch('/api/briefing/risks');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load risks');
  }

  return data.risks as BackendRisk[];
}

export async function apiGetLatestBriefing(): Promise<BackendBriefing | null> {
  const resp = await apiFetch('/api/briefing/latest');
  const data = await resp.json();

  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(data.message || 'Failed to load briefing');
  }

  return data.briefing as BackendBriefing | null;
}

export async function apiGenerateBriefing(): Promise<BackendBriefing> {
  const resp = await apiFetch('/api/briefing/generate', { method: 'POST' });
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to generate briefing');
  }

  return data.briefing as BackendBriefing;
}

export async function apiMarkBriefingRead(id: string): Promise<void> {
  const resp = await apiFetch(`/api/briefing/${id}/read`, { method: 'POST' });

  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(data.message || 'Failed to mark briefing as read');
  }
}

// ============================================
// INSIGHTS API (Content Intelligence)
// ============================================

export interface BackendContentIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  impactScore: number;
  estimatedViews: string;
  trendingScore: 'high' | 'medium' | 'low';
  audienceMatch: number;
  tags: string[];
  outline?: string[];
  source: 'ai' | 'trend' | 'comment' | 'manual';
}

export interface BackendTrend {
  topic: string;
  growthRate: number;
  relevanceScore: number;
  relatedVideos: string[];
  suggestedAngle: string;
}

export interface BackendCommentInsight {
  theme: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  frequency: number;
  exampleComments: string[];
  actionableSuggestion: string;
}

export interface BackendRepurposingSuggestion {
  sourceVideoId: string;
  sourceVideoTitle: string;
  format: 'short' | 'blog' | 'twitter_thread' | 'carousel';
  suggestion: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export async function apiGenerateIdeas(count = 5): Promise<BackendContentIdea[]> {
  const resp = await apiFetch('/api/insights/ideas/generate', {
    method: 'POST',
    body: JSON.stringify({ count }),
  });
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to generate ideas');
  }

  return data.ideas as BackendContentIdea[];
}

export async function apiGetTrends(): Promise<BackendTrend[]> {
  const resp = await apiFetch('/api/insights/trends');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load trends');
  }

  return data.trends as BackendTrend[];
}

export async function apiMineComments(videoId: string, maxComments = 100): Promise<BackendCommentInsight[]> {
  const resp = await apiFetch(`/api/insights/comments/${videoId}/mine`, {
    method: 'POST',
    body: JSON.stringify({ maxComments }),
  });
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to mine comments');
  }

  return data.insights as BackendCommentInsight[];
}

export async function apiGetRepurposingSuggestions(limit = 5): Promise<BackendRepurposingSuggestion[]> {
  const resp = await apiFetch(`/api/insights/repurposing?limit=${limit}`);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load repurposing suggestions');
  }

  return data.suggestions as BackendRepurposingSuggestion[];
}

// ============================================
// MEMORY API
// ============================================

export interface BackendMemoryEntry {
  id: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetMemory(): Promise<BackendMemoryEntry[]> {
  const resp = await apiFetch('/api/memory');
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to load memory');
  }

  return data.memories as BackendMemoryEntry[];
}

export async function apiSaveMemory(key: string, value: string, source = 'user'): Promise<BackendMemoryEntry> {
  const resp = await apiFetch('/api/memory', {
    method: 'POST',
    body: JSON.stringify({ key, value, source }),
  });
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to save memory');
  }

  return data.memory as BackendMemoryEntry;
}

export async function apiQueryMemory(query: string): Promise<BackendMemoryEntry[]> {
  const resp = await apiFetch(`/api/memory/query?q=${encodeURIComponent(query)}`);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || 'Failed to query memory');
  }

  return data.memories as BackendMemoryEntry[];
}

// ============================================
// CHAT API (SSE Streaming)
// ============================================

export interface ChatStreamEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  error?: string;
}

export interface ChatStreamOptions {
  message: string;
  conversationId?: string;
  onText?: (text: string) => void;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onToolResult?: (result: unknown) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

/**
 * Streams a chat message to the agent and handles events via callbacks.
 * Returns an AbortController to cancel the stream.
 */
export async function apiChatStream(options: ChatStreamOptions): Promise<AbortController> {
  const controller = new AbortController();
  const token = await storageGet(ACCESS_TOKEN_KEY);

  const resp = await fetch(`${API_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: options.message,
      conversationId: options.conversationId,
    }),
    signal: controller.signal,
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.message || 'Chat request failed');
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: ChatStreamEvent = JSON.parse(line.slice(6));

              switch (event.type) {
                case 'text':
                  options.onText?.(event.content || '');
                  break;
                case 'tool_call':
                  options.onToolCall?.(event.toolName || '', event.toolArgs || {});
                  break;
                case 'tool_result':
                  options.onToolResult?.(event.toolResult);
                  break;
                case 'done':
                  options.onDone?.();
                  break;
                case 'error':
                  options.onError?.(event.error || 'Unknown error');
                  break;
              }
            } catch {
              // Ignore malformed events
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        options.onError?.(err.message);
      }
    }
  })();

  return controller;
}
