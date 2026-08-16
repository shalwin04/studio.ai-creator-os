/**
 * YouTube Service
 *
 * YouTube API integration for OAuth, data sync, and analytics.
 */

import { randomBytes } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { env } from '../../lib/env.js';
import { getDb } from '../../lib/database.js';
import { getRedis } from '../../lib/redis.js';
import { creators, youtubeChannels, youtubeVideos, videoAnalytics, youtubeComments } from '../../db/schema.js';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const API_BASE = 'https://www.googleapis.com/youtube/v3';
const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
];

const OAUTH_STATE_PREFIX = 'youtube:oauth:state:';
const OAUTH_STATE_TTL_SECONDS = 600;

interface OAuthStatePayload {
  creatorId: string;
  redirectTo?: string;
}

// CSRF-safe, single-use state tokens tying a Google OAuth round trip back to
// the creator that started it (the callback is a plain browser redirect with
// no Authorization header, so we can't rely on the auth middleware there).
// Also carries an optional app-provided return URL (validated by the route
// against an origin allowlist before this is called).
export async function createOAuthState(creatorId: string, redirectTo?: string): Promise<string> {
  const state = randomBytes(24).toString('hex');
  const payload: OAuthStatePayload = { creatorId, redirectTo };
  await getRedis().set(`${OAUTH_STATE_PREFIX}${state}`, JSON.stringify(payload), 'EX', OAUTH_STATE_TTL_SECONDS);
  return state;
}

export async function resolveOAuthState(state: string): Promise<OAuthStatePayload | null> {
  const redis = getRedis();
  const key = `${OAUTH_STATE_PREFIX}${state}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  await redis.del(key);
  try {
    return JSON.parse(raw) as OAuthStatePayload;
  } catch {
    return null;
  }
}

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

export interface VideoData {
  videoId: string;
  title: string;
  description: string;
  publishedAt: Date;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface CommentData {
  commentId: string;
  authorName: string;
  text: string;
  likeCount: number;
  replyCount: number;
  publishedAt: Date;
}

export interface ChannelData {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class YouTubeService {
  private creatorId: string;
  private tokens: YouTubeTokens | null = null;

  constructor(creatorId: string) {
    this.creatorId = creatorId;
  }

  /**
   * Initialize OAuth flow
   */
  async getAuthUrl(redirectUri: string, appRedirectTo?: string): Promise<string> {
    const state = await createOAuthState(this.creatorId, appRedirectTo);

    const params = new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      scope: YOUTUBE_SCOPES.join(' '),
      state,
    });

    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  /**
   * Exchange auth code for tokens
   */
  async exchangeCode(code: string, redirectUri: string): Promise<YouTubeTokens> {
    const resp = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!resp.ok) {
      throw new Error(`YouTube token exchange failed: ${resp.status} ${await resp.text()}`);
    }

    const data = (await resp.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const tokens: YouTubeTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };

    this.tokens = tokens;

    const db = getDb();
    await db
      .update(creators)
      .set({
        youtubeConnected: true,
        youtubeAccessToken: tokens.accessToken,
        ...(tokens.refreshToken ? { youtubeRefreshToken: tokens.refreshToken } : {}),
        youtubeTokenExpiresAt: tokens.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, this.creatorId));

    return tokens;
  }

  /**
   * Refresh access token (reuses a still-valid cached token when possible)
   */
  async refreshAccessToken(): Promise<void> {
    const db = getDb();
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, this.creatorId),
    });

    if (!creator?.youtubeRefreshToken) {
      throw new Error('YouTube account not connected');
    }

    const stillValid =
      creator.youtubeAccessToken &&
      creator.youtubeTokenExpiresAt &&
      creator.youtubeTokenExpiresAt.getTime() - Date.now() > 5 * 60 * 1000;

    if (stillValid) {
      this.tokens = {
        accessToken: creator.youtubeAccessToken!,
        refreshToken: creator.youtubeRefreshToken,
        expiresAt: creator.youtubeTokenExpiresAt!,
      };
      return;
    }

    const resp = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        refresh_token: creator.youtubeRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!resp.ok) {
      throw new Error(`YouTube token refresh failed: ${resp.status} ${await resp.text()}`);
    }

    const data = (await resp.json()) as { access_token: string; expires_in: number };
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    this.tokens = {
      accessToken: data.access_token,
      refreshToken: creator.youtubeRefreshToken,
      expiresAt,
    };

    await db
      .update(creators)
      .set({
        youtubeAccessToken: data.access_token,
        youtubeTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, this.creatorId));
  }

  private async ensureTokens(): Promise<void> {
    if (!this.tokens) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Sync all channel data. Channel must exist before videos can be linked to
   * it, and analytics are keyed off the videos just synced, so this runs as
   * a strict pipeline rather than in parallel.
   */
  async sync(fullSync: boolean = false): Promise<void> {
    await this.refreshAccessToken();
    await this.syncChannel();
    await this.syncVideos(fullSync);
    await this.syncAnalytics();
  }

  /**
   * Sync channel data
   */
  async syncChannel(): Promise<ChannelData | null> {
    await this.ensureTokens();

    const resp = await fetch(`${API_BASE}/channels?part=snippet,statistics&mine=true`, {
      headers: { Authorization: `Bearer ${this.tokens!.accessToken}` },
    });

    if (!resp.ok) {
      throw new Error(`Failed to fetch YouTube channel: ${resp.status} ${await resp.text()}`);
    }

    const data = (await resp.json()) as {
      items?: Array<{
        id: string;
        snippet: {
          title: string;
          description: string;
          customUrl?: string;
          thumbnails?: { default?: { url: string } };
        };
        statistics: { subscriberCount: string; videoCount: string; viewCount: string };
      }>;
    };

    const channel = data.items?.[0];
    if (!channel) return null;

    const values = {
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnailUrl: channel.snippet.thumbnails?.default?.url,
      customUrl: channel.snippet.customUrl,
      subscriberCount: Number(channel.statistics.subscriberCount) || 0,
      videoCount: Number(channel.statistics.videoCount) || 0,
      viewCount: Number(channel.statistics.viewCount) || 0,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    };

    const db = getDb();
    const existing = await db.query.youtubeChannels.findFirst({
      where: eq(youtubeChannels.channelId, channel.id),
    });

    if (existing) {
      // channelId is globally unique — if a different creator connects the
      // same real YouTube channel (e.g. reusing an account across two of
      // our app logins), ownership transfers to whoever connected it most
      // recently, rather than silently updating stats under the old owner.
      await db
        .update(youtubeChannels)
        .set({ ...values, creatorId: this.creatorId })
        .where(eq(youtubeChannels.id, existing.id));
    } else {
      await db.insert(youtubeChannels).values({
        creatorId: this.creatorId,
        channelId: channel.id,
        ...values,
      });
    }

    return {
      channelId: channel.id,
      title: values.title,
      description: values.description ?? '',
      thumbnailUrl: values.thumbnailUrl ?? '',
      subscriberCount: values.subscriberCount,
      videoCount: values.videoCount,
      viewCount: values.viewCount,
    };
  }

  private async getChannelRecord() {
    const db = getDb();
    const channel = await db.query.youtubeChannels.findFirst({
      where: eq(youtubeChannels.creatorId, this.creatorId),
    });
    return channel ?? null;
  }

  /**
   * Sync videos: walks the channel's uploads playlist, then fetches
   * snippet/statistics/contentDetails for each batch of video IDs.
   */
  async syncVideos(fullSync: boolean = false): Promise<VideoData[]> {
    await this.ensureTokens();

    const channel = await this.getChannelRecord();
    if (!channel) return [];

    const channelResp = await fetch(
      `${API_BASE}/channels?part=contentDetails&id=${channel.channelId}`,
      { headers: { Authorization: `Bearer ${this.tokens!.accessToken}` } }
    );

    if (!channelResp.ok) {
      throw new Error(`Failed to fetch uploads playlist: ${channelResp.status} ${await channelResp.text()}`);
    }

    const channelData = (await channelResp.json()) as {
      items?: Array<{ contentDetails: { relatedPlaylists: { uploads: string } } }>;
    };
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    const maxPages = fullSync ? 10 : 2; // quota-conscious cap; ~50 videos/page
    const results: VideoData[] = [];
    const db = getDb();
    let pageToken: string | undefined;

    for (let page = 0; page < maxPages; page++) {
      let playlistUrl = `${API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`;
      if (pageToken) playlistUrl += `&pageToken=${pageToken}`;

      const playlistResp = await fetch(playlistUrl, {
        headers: { Authorization: `Bearer ${this.tokens!.accessToken}` },
      });

      if (!playlistResp.ok) {
        throw new Error(`Failed to fetch uploads: ${playlistResp.status} ${await playlistResp.text()}`);
      }

      const playlistData = (await playlistResp.json()) as {
        items?: Array<{ contentDetails: { videoId: string } }>;
        nextPageToken?: string;
      };

      const videoIds = playlistData.items?.map((item) => item.contentDetails.videoId).join(',');
      if (!videoIds) break;

      const videosResp = await fetch(
        `${API_BASE}/videos?part=snippet,statistics,contentDetails,status&id=${videoIds}`,
        { headers: { Authorization: `Bearer ${this.tokens!.accessToken}` } }
      );

      if (!videosResp.ok) {
        throw new Error(`Failed to fetch video details: ${videosResp.status} ${await videosResp.text()}`);
      }

      const videosData = (await videosResp.json()) as {
        items?: Array<{
          id: string;
          snippet: {
            title: string;
            description: string;
            publishedAt: string;
            thumbnails?: { high?: { url: string } };
            tags?: string[];
            categoryId?: string;
          };
          statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
          contentDetails: { duration: string };
          status: { privacyStatus: string };
        }>;
      };

      for (const video of videosData.items ?? []) {
        const durationSeconds = parseDurationToSeconds(video.contentDetails.duration);
        const values = {
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnailUrl: video.snippet.thumbnails?.high?.url,
          publishedAt: new Date(video.snippet.publishedAt),
          duration: video.contentDetails.duration,
          tags: video.snippet.tags ?? [],
          categoryId: video.snippet.categoryId,
          privacyStatus: video.status.privacyStatus,
          viewCount: Number(video.statistics.viewCount) || 0,
          likeCount: Number(video.statistics.likeCount) || 0,
          commentCount: Number(video.statistics.commentCount) || 0,
          isShort: durationSeconds > 0 && durationSeconds <= 60,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        };

        const existing = await db.query.youtubeVideos.findFirst({
          where: eq(youtubeVideos.videoId, video.id),
        });

        if (existing) {
          await db.update(youtubeVideos).set(values).where(eq(youtubeVideos.id, existing.id));
        } else {
          await db.insert(youtubeVideos).values({
            channelId: channel.id,
            videoId: video.id,
            ...values,
          });
        }

        results.push({
          videoId: video.id,
          title: values.title,
          description: values.description ?? '',
          publishedAt: values.publishedAt,
          thumbnailUrl: values.thumbnailUrl ?? '',
          duration: values.duration,
          viewCount: values.viewCount,
          likeCount: values.likeCount,
          commentCount: values.commentCount,
        });
      }

      pageToken = playlistData.nextPageToken;
      if (!pageToken) break;
    }

    return results;
  }

  /**
   * Sync per-video daily analytics for the last 30 days, for videos already
   * synced via syncVideos().
   */
  async syncAnalytics(): Promise<void> {
    await this.ensureTokens();

    const channel = await this.getChannelRecord();
    if (!channel) return;

    const db = getDb();
    const videos = await db.query.youtubeVideos.findMany({
      where: eq(youtubeVideos.channelId, channel.id),
    });
    if (videos.length === 0) return;

    const videoIdByYoutubeId = new Map(videos.map((v) => [v.videoId, v.id]));

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    const metrics = [
      'views',
      'estimatedMinutesWatched',
      'likes',
      'comments',
      'shares',
      'subscribersGained',
      'averageViewDuration',
      'averageViewPercentage',
    ].join(',');

    // YouTube Analytics API allows filtering by a comma-separated OR list of video IDs.
    const videoIdChunks: string[][] = [];
    const chunkSize = 200;
    const youtubeIds = videos.map((v) => v.videoId);
    for (let i = 0; i < youtubeIds.length; i += chunkSize) {
      videoIdChunks.push(youtubeIds.slice(i, i + chunkSize));
    }

    for (const chunk of videoIdChunks) {
      const url =
        `${ANALYTICS_BASE}/reports?ids=channel==${channel.channelId}` +
        `&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}` +
        `&metrics=${metrics}&dimensions=day,video&filters=video==${chunk.join(',')}&sort=day`;

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${this.tokens!.accessToken}` },
      });

      if (!resp.ok) {
        // Analytics can be unavailable (e.g. brand-new channel, no data yet) — skip rather than fail the whole sync.
        continue;
      }

      const data = (await resp.json()) as { rows?: any[][] };

      for (const row of data.rows ?? []) {
        const [day, youtubeVideoId, views, watchTimeMinutes, likes, comments, shares, subscribersGained, avgViewDuration, avgViewPercentage] = row;
        const internalVideoId = videoIdByYoutubeId.get(youtubeVideoId);
        if (!internalVideoId) continue;

        const values = {
          views: Number(views) || 0,
          watchTimeMinutes: Number(watchTimeMinutes) || 0,
          likes: Number(likes) || 0,
          comments: Number(comments) || 0,
          shares: Number(shares) || 0,
          subscribersGained: Number(subscribersGained) || 0,
          avgViewDuration: Number(avgViewDuration) || 0,
          avgViewPercentage: Number(avgViewPercentage) || 0,
        };

        const existing = await db.query.videoAnalytics.findFirst({
          where: and(eq(videoAnalytics.videoId, internalVideoId), eq(videoAnalytics.date, day)),
        });

        if (existing) {
          await db.update(videoAnalytics).set(values).where(eq(videoAnalytics.id, existing.id));
        } else {
          await db.insert(videoAnalytics).values({
            videoId: internalVideoId,
            date: day,
            ...values,
          });
        }
      }
    }
  }

  /**
   * Fetch and persist top-level comments for a video (for comment mining).
   * `videoId` is our internal UUID; the YouTube video ID is looked up from it.
   */
  async fetchComments(videoId: string, maxResults: number = 100): Promise<CommentData[]> {
    await this.ensureTokens();

    const db = getDb();
    const video = await db.query.youtubeVideos.findFirst({
      where: eq(youtubeVideos.id, videoId),
    });
    if (!video) return [];

    const results: CommentData[] = [];
    let pageToken: string | undefined;

    while (results.length < maxResults) {
      const pageSize = Math.min(100, maxResults - results.length);
      let url =
        `${API_BASE}/commentThreads?part=snippet&videoId=${video.videoId}` +
        `&order=relevance&maxResults=${pageSize}&textFormat=plainText`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${this.tokens!.accessToken}` },
      });

      if (!resp.ok) {
        // Comments can be disabled for a video — skip rather than fail the whole call.
        if (resp.status === 403) break;
        throw new Error(`Failed to fetch comments: ${resp.status} ${await resp.text()}`);
      }

      const data = (await resp.json()) as {
        items?: Array<{
          id: string;
          snippet: {
            topLevelComment: {
              snippet: {
                authorDisplayName: string;
                textOriginal: string;
                likeCount: number;
                publishedAt: string;
              };
            };
            totalReplyCount: number;
          };
        }>;
        nextPageToken?: string;
      };

      for (const item of data.items ?? []) {
        const snippet = item.snippet.topLevelComment.snippet;
        const values = {
          videoId,
          authorName: snippet.authorDisplayName,
          text: snippet.textOriginal,
          likeCount: snippet.likeCount ?? 0,
          replyCount: item.snippet.totalReplyCount ?? 0,
          publishedAt: new Date(snippet.publishedAt),
        };

        const existing = await db.query.youtubeComments.findFirst({
          where: eq(youtubeComments.commentId, item.id),
        });

        if (existing) {
          await db.update(youtubeComments).set(values).where(eq(youtubeComments.id, existing.id));
        } else {
          await db.insert(youtubeComments).values({ commentId: item.id, ...values });
        }

        results.push({
          commentId: item.id,
          authorName: values.authorName,
          text: values.text,
          likeCount: values.likeCount,
          replyCount: values.replyCount,
          publishedAt: values.publishedAt,
        });
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    return results;
  }

  /**
   * Check remaining API quota
   */
  async checkQuota(): Promise<{ used: number; remaining: number }> {
    // TODO: Check quota usage
    return { used: 0, remaining: 10000 };
  }
}
