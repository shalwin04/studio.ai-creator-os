/**
 * Insights Routes
 *
 * Content intelligence: idea generation, trend detection, comment mining,
 * repurposing suggestions.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ContentIntelligenceService } from '../../services/content/index.js';

const generateIdeasSchema = z.object({
  count: z.number().min(1).max(10).default(5),
});

const videoParamsSchema = z.object({
  videoId: z.string().uuid(),
});

const mineCommentsSchema = z.object({
  maxComments: z.coerce.number().min(1).max(500).default(100),
});

const repurposingQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(5),
});

export const insightsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/insights/ideas/generate
  fastify.post('/ideas/generate', async (request) => {
    const creatorId = request.user!.creatorId;
    const body = generateIdeasSchema.parse(request.body ?? {});
    const service = new ContentIntelligenceService(creatorId);

    const ideas = await service.generateIdeas(body.count);

    return { ideas };
  });

  // GET /api/insights/trends
  fastify.get('/trends', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new ContentIntelligenceService(creatorId);

    const trends = await service.detectTrends();

    return { trends };
  });

  // POST /api/insights/comments/:videoId/mine
  fastify.post('/comments/:videoId/mine', async (request) => {
    const creatorId = request.user!.creatorId;
    const { videoId } = videoParamsSchema.parse(request.params);
    const body = mineCommentsSchema.parse(request.body ?? {});
    const service = new ContentIntelligenceService(creatorId);

    const insights = await service.mineComments(videoId, body.maxComments);

    return { insights };
  });

  // GET /api/insights/repurposing
  fastify.get('/repurposing', async (request) => {
    const creatorId = request.user!.creatorId;
    const query = repurposingQuerySchema.parse(request.query);
    const service = new ContentIntelligenceService(creatorId);

    const suggestions = await service.suggestRepurposing(query.limit);

    return { suggestions };
  });
};
