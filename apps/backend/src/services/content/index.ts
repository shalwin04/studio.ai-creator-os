/**
 * Content Intelligence Service
 *
 * AI-generated ideas, trend detection, comment mining, repurposing suggestions.
 */

import { and, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import { gemini } from '../../lib/llm.js';
import { getDb } from '../../lib/database.js';
import { contentIdeas, youtubeChannels, youtubeVideos, videoAnalytics } from '../../db/schema.js';
import { MemoryService } from '../agent/memory/index.js';
import { YouTubeService } from '../youtube/index.js';

export interface GeneratedIdea {
  title: string;
  description: string;
  format: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface TrendSignal {
  tag: string;
  recentViews: number;
  previousViews: number;
  changePercent: number;
}

export interface CommentInsights {
  videoId: string;
  commentsAnalyzed: number;
  themes: string[];
  topRequests: string[];
  sentiment: 'positive' | 'mixed' | 'negative';
}

export interface RepurposingSuggestion {
  videoId: string;
  videoTitle: string;
  suggestion: string;
  format: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function extractJson(text: string): any {
  const cleaned = text.trim().replace(/^```json\s*|^```\s*|\s*```$/g, '');
  return JSON.parse(cleaned);
}

export class ContentIntelligenceService {
  private creatorId: string;

  constructor(creatorId: string) {
    this.creatorId = creatorId;
  }

  /**
   * Generate new content ideas from the creator's memory, goals, and recent
   * top-performing videos.
   */
  async generateIdeas(count: number = 5): Promise<GeneratedIdea[]> {
    const db = getDb();
    const memory = new MemoryService(this.creatorId);
    const [context, topVideos] = await Promise.all([
      memory.retrieveContext('content ideas for my channel', { limit: 5 }),
      this.getTopVideos(5),
    ]);

    const prompt = `You are a content strategist for a YouTube creator. Suggest ${count} new video ideas.
Respond with ONLY a JSON array (no markdown fences), each item shaped like:
{"title": string, "description": string, "format": string, "estimatedEffort": "low"|"medium"|"high", "tags": string[]}

Creator goals: ${JSON.stringify(context.creatorState?.goals ?? [])}
Creator preferences: ${JSON.stringify(context.creatorState?.preferences ?? [])}
Recent top-performing videos: ${JSON.stringify(
      topVideos.map((v) => ({ title: v.title, tags: v.tags, viewCount: v.viewCount }))
    )}
Relevant memories: ${JSON.stringify(context.relevantMemories.map((m) => m.content))}`;

    const response = await gemini.invoke(prompt);
    const text = typeof response.content === 'string' ? response.content : String(response.content);

    let ideas: GeneratedIdea[] = [];
    try {
      ideas = extractJson(text);
    } catch {
      return [];
    }

    if (ideas.length > 0) {
      await db.insert(contentIdeas).values(
        ideas.map((idea) => ({
          creatorId: this.creatorId,
          title: idea.title,
          description: idea.description,
          source: 'ai_generated',
          format: idea.format,
          estimatedEffort: idea.estimatedEffort,
          tags: idea.tags,
        }))
      );
    }

    return ideas;
  }

  /**
   * Detect rising/falling tags by comparing the last 14 days of views
   * against the 14 days before that, across the creator's own catalog.
   */
  async detectTrends(): Promise<TrendSignal[]> {
    const db = getDb();
    const channel = await db.query.youtubeChannels.findFirst({
      where: eq(youtubeChannels.creatorId, this.creatorId),
    });
    if (!channel) return [];

    const videos = await db.query.youtubeVideos.findMany({
      where: eq(youtubeVideos.channelId, channel.id),
    });
    if (videos.length === 0) return [];

    const videoIds = videos.map((v) => v.id);
    const videoTagsById = new Map(videos.map((v) => [v.id, (v.tags as string[] | null) ?? []]));

    const fourteenDaysAgo = new Date(Date.now() - 14 * DAY_MS).toISOString().slice(0, 10);
    const twentyEightDaysAgo = new Date(Date.now() - 28 * DAY_MS).toISOString().slice(0, 10);

    const [recent, previous] = await Promise.all([
      db
        .select()
        .from(videoAnalytics)
        .where(and(inArray(videoAnalytics.videoId, videoIds), gte(videoAnalytics.date, fourteenDaysAgo))),
      db
        .select()
        .from(videoAnalytics)
        .where(
          and(
            inArray(videoAnalytics.videoId, videoIds),
            gte(videoAnalytics.date, twentyEightDaysAgo),
            lt(videoAnalytics.date, fourteenDaysAgo)
          )
        ),
    ]);

    const tally = (rows: typeof recent) => {
      const byTag = new Map<string, number>();
      for (const row of rows) {
        const tags = videoTagsById.get(row.videoId) ?? [];
        for (const tag of tags) {
          byTag.set(tag, (byTag.get(tag) ?? 0) + (row.views ?? 0));
        }
      }
      return byTag;
    };

    const recentByTag = tally(recent);
    const previousByTag = tally(previous);

    const tags = new Set([...recentByTag.keys(), ...previousByTag.keys()]);
    const signals: TrendSignal[] = [];

    for (const tag of tags) {
      const recentViews = recentByTag.get(tag) ?? 0;
      const previousViews = previousByTag.get(tag) ?? 0;
      const changePercent =
        previousViews === 0 ? (recentViews > 0 ? 100 : 0) : ((recentViews - previousViews) / previousViews) * 100;
      signals.push({ tag, recentViews, previousViews, changePercent });
    }

    return signals.sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
  }

  /**
   * Mine comments for a video: fetches (and persists) recent comments, then
   * asks the model to summarize themes and common requests.
   */
  async mineComments(videoId: string, maxComments: number = 100): Promise<CommentInsights> {
    const youtube = new YouTubeService(this.creatorId);
    const comments = await youtube.fetchComments(videoId, maxComments);

    if (comments.length === 0) {
      return { videoId, commentsAnalyzed: 0, themes: [], topRequests: [], sentiment: 'mixed' };
    }

    const prompt = `Analyze these YouTube comments and respond with ONLY a JSON object (no markdown fences) shaped like:
{"themes": string[], "topRequests": string[], "sentiment": "positive"|"mixed"|"negative"}

"themes" are the 3-5 most common topics/opinions across comments.
"topRequests" are specific things commenters are asking for (future videos, clarifications, etc.), up to 5.

Comments:
${comments.map((c) => `- ${c.text}`).join('\n')}`;

    const response = await gemini.invoke(prompt);
    const text = typeof response.content === 'string' ? response.content : String(response.content);

    let parsed: { themes?: string[]; topRequests?: string[]; sentiment?: CommentInsights['sentiment'] } = {};
    try {
      parsed = extractJson(text);
    } catch {
      // Fall back to defaults below if the model output isn't parseable JSON.
    }

    return {
      videoId,
      commentsAnalyzed: comments.length,
      themes: parsed.themes ?? [],
      topRequests: parsed.topRequests ?? [],
      sentiment: parsed.sentiment ?? 'mixed',
    };
  }

  /**
   * Suggest repurposing angles for high-performing long-form videos.
   */
  async suggestRepurposing(limit: number = 5): Promise<RepurposingSuggestion[]> {
    const db = getDb();
    const channel = await db.query.youtubeChannels.findFirst({
      where: eq(youtubeChannels.creatorId, this.creatorId),
    });
    if (!channel) return [];

    const videos = await db.query.youtubeVideos.findMany({
      where: and(eq(youtubeVideos.channelId, channel.id), eq(youtubeVideos.isShort, false)),
      orderBy: desc(youtubeVideos.viewCount),
      limit: limit * 2,
    });
    if (videos.length === 0) return [];

    const sortedViews = videos.map((v) => v.viewCount ?? 0).sort((a, b) => a - b);
    const medianViews = sortedViews[Math.floor(videos.length / 2)] ?? 0;
    const candidates = videos.filter((v) => (v.viewCount ?? 0) >= medianViews).slice(0, limit);

    const suggestions: RepurposingSuggestion[] = [];
    for (const video of candidates) {
      const prompt = `This long-form YouTube video performed well: "${video.title}" (${video.viewCount} views).
In one sentence, suggest a specific way to repurpose it into a Short or a clip series. Respond with plain text only, no JSON.`;

      try {
        const response = await gemini.invoke(prompt);
        const text = typeof response.content === 'string' ? response.content : String(response.content);
        suggestions.push({
          videoId: video.id,
          videoTitle: video.title ?? '',
          suggestion: text.trim(),
          format: 'short',
        });
      } catch {
        continue;
      }
    }

    return suggestions;
  }

  private async getTopVideos(limit: number) {
    const db = getDb();
    const channel = await db.query.youtubeChannels.findFirst({
      where: eq(youtubeChannels.creatorId, this.creatorId),
    });
    if (!channel) return [];

    return db.query.youtubeVideos.findMany({
      where: eq(youtubeVideos.channelId, channel.id),
      orderBy: desc(youtubeVideos.viewCount),
      limit,
    });
  }
}
