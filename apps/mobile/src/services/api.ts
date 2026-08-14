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
