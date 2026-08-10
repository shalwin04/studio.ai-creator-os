/**
 * Global State Management (Zustand)
 *
 * Centralized state for the application including:
 * - Auth state
 * - User/Creator profile
 * - Current conversation
 * - UI state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { Creator } from '../services/supabase';

// ============================================
// AUTH STORE
// ============================================

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setSession: (session) =>
        set({
          session,
          isAuthenticated: !!session,
        }),

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      signOut: () =>
        set({
          session: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// CREATOR STORE
// ============================================

interface CreatorState {
  profile: Creator | null;
  isOnboarded: boolean;
  youtubeConnected: boolean;

  setProfile: (profile: Creator | null) => void;
  updateProfile: (updates: Partial<Creator>) => void;
  setYoutubeConnected: (connected: boolean) => void;
}

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set) => ({
      profile: null,
      isOnboarded: false,
      youtubeConnected: false,

      setProfile: (profile) =>
        set({
          profile,
          isOnboarded: profile?.onboarding_completed ?? false,
          youtubeConnected: profile?.youtube_connected ?? false,
        }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
          isOnboarded: updates.onboarding_completed ?? state.isOnboarded,
          youtubeConnected: updates.youtube_connected ?? state.youtubeConnected,
        })),

      setYoutubeConnected: (connected) =>
        set((state) => ({
          youtubeConnected: connected,
          profile: state.profile
            ? { ...state.profile, youtube_connected: connected }
            : null,
        })),
    }),
    {
      name: 'creator-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        youtubeConnected: state.youtubeConnected,
      }),
    }
  )
);

// ============================================
// CONVERSATION STORE
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: any[];
  isStreaming?: boolean;
  createdAt: Date;
}

interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  isStreaming: boolean;

  setConversationId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
}

export const useConversationStore = create<ConversationState>()((set) => ({
  conversationId: null,
  messages: [],
  isStreaming: false,

  setConversationId: (conversationId) => set({ conversationId }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  clearMessages: () => set({ messages: [], conversationId: null }),

  setStreaming: (isStreaming) => set({ isStreaming }),
}));

// ============================================
// UI STORE
// ============================================

interface UIState {
  theme: 'light' | 'dark' | 'system';
  isOffline: boolean;
  pendingSyncCount: number;
  activeTab: string;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setOffline: (offline: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      isOffline: false,
      pendingSyncCount: 0,
      activeTab: 'chat',

      setTheme: (theme) => set({ theme }),
      setOffline: (isOffline) => set({ isOffline }),
      setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);

// ============================================
// TASKS STORE
// ============================================

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  dueDate: string | null;
  category: string | null;
  tags: string[];
}

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  filter: {
    status: string | null;
    category: string | null;
  };

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: Partial<TasksState['filter']>) => void;
}

export const useTasksStore = create<TasksState>()((set) => ({
  tasks: [],
  isLoading: false,
  filter: {
    status: null,
    category: null,
  },

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),
}));

// ============================================
// BRIEFING STORE
// ============================================

interface Briefing {
  id: string;
  date: string;
  content: string;
  topPriorities: any[];
  keyMetrics: any;
  opportunities: any[];
  warnings: any[];
  readAt: string | null;
}

interface BriefingState {
  todayBriefing: Briefing | null;
  isLoading: boolean;

  setBriefing: (briefing: Briefing | null) => void;
  markAsRead: () => void;
  setLoading: (loading: boolean) => void;
}

export const useBriefingStore = create<BriefingState>()((set) => ({
  todayBriefing: null,
  isLoading: false,

  setBriefing: (todayBriefing) => set({ todayBriefing }),

  markAsRead: () =>
    set((state) => ({
      todayBriefing: state.todayBriefing
        ? { ...state.todayBriefing, readAt: new Date().toISOString() }
        : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));
