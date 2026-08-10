/**
 * API Client
 *
 * Type-safe client for the Agentic Creator backend API.
 */

import type {
  ApiResponse,
  Task,
  ContentIdea,
  Conversation,
  Message,
  YouTubeChannel,
  YouTubeVideo,
  Sponsorship,
  ImpactScore,
  DailyBriefing,
  StreamEvent,
} from '@agentic-creator/shared-types';

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getToken = config.getToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data };
    }

    return { data };
  }

  // ============ AUTH ============

  auth = {
    me: () => this.request('/api/auth/me'),
    connectYouTube: () => this.request('/api/auth/youtube/connect', { method: 'POST' }),
  };

  // ============ CHAT ============

  chat = {
    stream: async function* (
      baseUrl: string,
      token: string,
      message: string,
      conversationId?: string
    ): AsyncGenerator<StreamEvent> {
      const response = await fetch(`${baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, conversationId }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data) {
              yield JSON.parse(data) as StreamEvent;
            }
          }
        }
      }
    },

    listConversations: () =>
      this.request<Conversation[]>('/api/chat/conversations'),

    getConversation: (id: string) =>
      this.request<{ conversation: Conversation; messages: Message[] }>(
        `/api/chat/conversations/${id}`
      ),

    deleteConversation: (id: string) =>
      this.request(`/api/chat/conversations/${id}`, { method: 'DELETE' }),
  };

  // ============ TASKS ============

  tasks = {
    list: (params?: { status?: string; priority?: string }) =>
      this.request<Task[]>(
        `/api/tasks${params ? `?${new URLSearchParams(params as any)}` : ''}`
      ),

    create: (task: Partial<Task>) =>
      this.request<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      }),

    get: (id: string) => this.request<Task>(`/api/tasks/${id}`),

    update: (id: string, task: Partial<Task>) =>
      this.request<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(task),
      }),

    delete: (id: string) =>
      this.request(`/api/tasks/${id}`, { method: 'DELETE' }),
  };

  // ============ CONTENT ============

  content = {
    listIdeas: () => this.request<ContentIdea[]>('/api/content/ideas'),

    createIdea: (idea: Partial<ContentIdea>) =>
      this.request<ContentIdea>('/api/content/ideas', {
        method: 'POST',
        body: JSON.stringify(idea),
      }),

    generateIdeas: (count?: number) =>
      this.request<ContentIdea[]>('/api/content/ideas/generate', {
        method: 'POST',
        body: JSON.stringify({ count }),
      }),

    getPipeline: () => this.request('/api/content/pipeline'),

    listSponsorships: () =>
      this.request<Sponsorship[]>('/api/content/sponsorships'),
  };

  // ============ YOUTUBE ============

  youtube = {
    getChannel: () => this.request<YouTubeChannel>('/api/youtube/channel'),

    listVideos: () => this.request<YouTubeVideo[]>('/api/youtube/videos'),

    getVideo: (id: string) =>
      this.request<YouTubeVideo>(`/api/youtube/videos/${id}`),

    getAnalytics: () => this.request('/api/youtube/analytics'),

    triggerSync: () =>
      this.request('/api/youtube/sync', { method: 'POST' }),

    getInsights: () => this.request('/api/youtube/insights'),
  };

  // ============ IMPACT ============

  impact = {
    getScores: () => this.request<ImpactScore[]>('/api/impact/scores'),

    getTopRecommendation: () =>
      this.request<ImpactScore>('/api/impact/recommendation'),
  };

  // ============ BRIEFING ============

  briefing = {
    getLatest: () => this.request<DailyBriefing>('/api/briefing/latest'),

    generate: () =>
      this.request<DailyBriefing>('/api/briefing/generate', { method: 'POST' }),

    markAsRead: (id: string) =>
      this.request(`/api/briefing/${id}/read`, { method: 'POST' }),
  };
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
