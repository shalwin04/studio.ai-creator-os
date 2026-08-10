import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Environment variables (should be in .env file)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '⚠️ Supabase configuration missing!\n' +
    'Please create apps/mobile/.env with:\n' +
    '  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n\n' +
    'Get these from: Supabase Dashboard → Project Settings → API'
  );
}

// Secure storage adapter for tokens
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

// Create Supabase client (with fallback for missing config)
const createSupabaseClient = (): SupabaseClient => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Return a dummy client that will fail gracefully
    // This allows the app to at least render the error UI
    return createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder',
      {
        auth: {
          storage: ExpoSecureStoreAdapter,
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

export const supabase: SupabaseClient = createSupabaseClient();

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('placeholder'));
};

// ============================================
// AUTH HELPERS
// ============================================

export async function signUp(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

// ============================================
// CREATOR PROFILE
// ============================================

export interface Creator {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  onboarding_completed: boolean;
  youtube_connected: boolean;
  notification_preferences: {
    daily_briefing: boolean;
    deadline_reminders: boolean;
    performance_alerts: boolean;
    opportunity_alerts: boolean;
  };
  created_at: string;
  updated_at: string;
}

export async function getCreatorProfile(userId: string): Promise<Creator | null> {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCreatorProfile(userId: string, updates: Partial<Creator>) {
  const { data, error } = await supabase
    .from('creators')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// YOUTUBE CHANNEL
// ============================================

export interface YouTubeChannel {
  id: string;
  creator_id: string;
  channel_id: string;
  title: string;
  description: string | null;
  custom_url: string | null;
  thumbnail_url: string | null;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  last_synced_at: string | null;
  sync_status: string;
}

export async function getYouTubeChannel(creatorId: string): Promise<YouTubeChannel | null> {
  const { data, error } = await supabase
    .from('youtube_channels')
    .select('*')
    .eq('creator_id', creatorId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows returned"
  return data;
}

export async function saveYouTubeChannel(channel: Omit<YouTubeChannel, 'id'>) {
  const { data, error } = await supabase
    .from('youtube_channels')
    .upsert(channel, { onConflict: 'channel_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// TASKS
// ============================================

export interface Task {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  due_date: string | null;
  completed_at: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export async function getTasks(creatorId: string, status?: string) {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('creator_id', creatorId)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true, nullsFirst: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// CONVERSATIONS & MESSAGES
// ============================================

export interface Conversation {
  id: string;
  creator_id: string;
  title: string | null;
  summary: string | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  is_archived: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls: any | null;
  tool_call_id: string | null;
  metadata: any | null;
  created_at: string;
}

export async function getOrCreateConversation(creatorId: string): Promise<Conversation> {
  // Get the most recent active conversation
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('is_archived', false)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert({ creator_id: creatorId })
    .select()
    .single();

  if (createError) throw createError;
  return newConversation;
}

export async function getConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function addMessage(message: Omit<Message, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) throw error;

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      message_count: supabase.rpc('increment', { x: 1 })
    })
    .eq('id', message.conversation_id);

  return data;
}

// ============================================
// CONTENT IDEAS
// ============================================

export interface ContentIdea {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  source: string;
  format: string;
  status: string;
  tags: string[] | null;
  estimated_effort: number | null;
  potential_impact: number | null;
  impact_reasoning: string | null;
  created_at: string;
  updated_at: string;
}

export async function getContentIdeas(creatorId: string, status?: string) {
  let query = supabase
    .from('content_ideas')
    .select('*')
    .eq('creator_id', creatorId)
    .order('potential_impact', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createContentIdea(idea: Omit<ContentIdea, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('content_ideas')
    .insert(idea)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// IMPACT SCORES
// ============================================

export interface ImpactScore {
  id: string;
  creator_id: string;
  date: string;
  item_type: string;
  item_id: string | null;
  action_description: string;
  total_score: number;
  urgency_score: number;
  revenue_score: number;
  audience_score: number;
  goal_alignment_score: number;
  effort_score: number;
  momentum_score: number;
  reasoning: string | null;
  is_top_recommendation: boolean;
}

export async function getTopImpactActions(creatorId: string, date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('impact_scores')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('date', targetDate)
    .order('total_score', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data;
}

// ============================================
// DAILY BRIEFING
// ============================================

export interface DailyBriefing {
  id: string;
  creator_id: string;
  date: string;
  briefing_content: string;
  top_priorities: any;
  key_metrics: any;
  opportunities: any;
  warnings: any;
  generated_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

export async function getTodayBriefing(creatorId: string): Promise<DailyBriefing | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_briefings')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
}

export function subscribeToNotifications(
  creatorId: string,
  callback: (notification: any) => void
) {
  return supabase
    .channel(`notifications:${creatorId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'proactive_notifications',
        filter: `creator_id=eq.${creatorId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}

export default supabase;
