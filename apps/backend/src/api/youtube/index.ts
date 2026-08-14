/**
 * YouTube Routes
 *
 * YouTube data and analytics endpoints.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '../../lib/database.js';
import { youtubeChannels, youtubeVideos, videoAnalytics } from '../../db/schema.js';
import { YouTubeService } from '../../services/youtube/index.js';

const idParamsSchema = z.object({ id: z.string().uuid() });

const syncBodySchema = z.object({
  fullSync: z.boolean().default(false),
});

async function getOwnedChannel(creatorId: string) {
  const db = getDb();
  return db.query.youtubeChannels.findFirst({
    where: eq(youtubeChannels.creatorId, creatorId),
  });
}

export const youtubeRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/youtube/channel
  fastify.get('/channel', async (request) => {
    const channel = await getOwnedChannel(request.user!.creatorId);
    return { channel: channel ?? null };
  });

  // GET /api/youtube/videos
  fastify.get('/videos', async (request, reply) => {
    const channel = await getOwnedChannel(request.user!.creatorId);
    if (!channel) {
      return reply.status(404).send({ error: 'NotFound', message: 'YouTube channel not connected' });
    }

    const db = getDb();
    const videos = await db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.channelId, channel.id))
      .orderBy(desc(youtubeVideos.publishedAt));

    return { videos };
  });

  // GET /api/youtube/videos/:id
  fastify.get('/videos/:id', async (request, reply) => {
    const channel = await getOwnedChannel(request.user!.creatorId);
    if (!channel) {
      return reply.status(404).send({ error: 'NotFound', message: 'YouTube channel not connected' });
    }

    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();
    const video = await db.query.youtubeVideos.findFirst({
      where: and(eq(youtubeVideos.id, id), eq(youtubeVideos.channelId, channel.id)),
    });

    if (!video) {
      return reply.status(404).send({ error: 'NotFound', message: 'Video not found' });
    }

    return { video };
  });

  // GET /api/youtube/videos/:id/analytics
  fastify.get('/videos/:id/analytics', async (request, reply) => {
    const channel = await getOwnedChannel(request.user!.creatorId);
    if (!channel) {
      return reply.status(404).send({ error: 'NotFound', message: 'YouTube channel not connected' });
    }

    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const video = await db.query.youtubeVideos.findFirst({
      where: and(eq(youtubeVideos.id, id), eq(youtubeVideos.channelId, channel.id)),
    });

    if (!video) {
      return reply.status(404).send({ error: 'NotFound', message: 'Video not found' });
    }

    const analytics = await db
      .select()
      .from(videoAnalytics)
      .where(eq(videoAnalytics.videoId, id))
      .orderBy(videoAnalytics.date);

    return { analytics };
  });

  // GET /api/youtube/videos/:id/comments
  fastify.get('/videos/:id/comments', async (request, reply) => {
    // TODO: Comment mining is Suba's Intelligence scope
    return { comments: [] };
  });

  // GET /api/youtube/analytics
  // Channel-level rollup: per-day totals across all synced videos.
  fastify.get('/analytics', async (request, reply) => {
    const channel = await getOwnedChannel(request.user!.creatorId);
    if (!channel) {
      return reply.status(404).send({ error: 'NotFound', message: 'YouTube channel not connected' });
    }

    const db = getDb();
    const videos = await db
      .select({ id: youtubeVideos.id })
      .from(youtubeVideos)
      .where(eq(youtubeVideos.channelId, channel.id));

    if (videos.length === 0) {
      return { analytics: [] };
    }

    const rows = await db
      .select()
      .from(videoAnalytics)
      .where(inArray(videoAnalytics.videoId, videos.map((v) => v.id)))
      .orderBy(videoAnalytics.date);

    const byDate = new Map<
      string,
      { date: string; views: number; watchTimeMinutes: number; likes: number; comments: number; shares: number; subscribersGained: number }
    >();

    for (const row of rows) {
      const existing = byDate.get(row.date) ?? {
        date: row.date,
        views: 0,
        watchTimeMinutes: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        subscribersGained: 0,
      };

      existing.views += row.views ?? 0;
      existing.watchTimeMinutes += row.watchTimeMinutes ?? 0;
      existing.likes += row.likes ?? 0;
      existing.comments += row.comments ?? 0;
      existing.shares += row.shares ?? 0;
      existing.subscribersGained += row.subscribersGained ?? 0;

      byDate.set(row.date, existing);
    }

    return { analytics: Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)) };
  });

  // POST /api/youtube/sync
  fastify.post('/sync', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const body = syncBodySchema.parse(request.body ?? {});

    try {
      const service = new YouTubeService(creatorId);
      await service.sync(body.fullSync);

      const channel = await getOwnedChannel(creatorId);
      return { success: true, channel };
    } catch (error: any) {
      request.log.error(error, 'YouTube sync failed');
      return reply.status(400).send({
        error: 'SyncFailed',
        message: error?.message ?? 'YouTube sync failed',
      });
    }
  });

  // GET /api/youtube/insights
  fastify.get('/insights', async (request, reply) => {
    // TODO: AI-generated insights are Suba's Intelligence scope
    return { insights: [] };
  });

  // GET /api/youtube/audience
  fastify.get('/audience', async (request, reply) => {
    // TODO: Audience insights are Suba's Intelligence scope
    return { insights: [] };
  });
};
