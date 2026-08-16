/**
 * Briefing Routes
 *
 * Daily AI briefings.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { BriefingService } from '../../services/briefing/index.js';

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const briefingRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/briefing/performance
  fastify.get('/performance', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new BriefingService(creatorId);

    const metrics = await service.getPerformanceInsights();

    return { metrics };
  });

  // GET /api/briefing/opportunities
  fastify.get('/opportunities', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new BriefingService(creatorId);

    const opportunities = await service.getOpportunityAlerts();

    return { opportunities };
  });

  // GET /api/briefing/risks
  fastify.get('/risks', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new BriefingService(creatorId);

    const risks = await service.getRiskAlerts();

    return { risks };
  });

  // GET /api/briefing/latest
  fastify.get('/latest', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new BriefingService(creatorId);

    const briefing = await service.getLatest();

    return { briefing };
  });

  // POST /api/briefing/generate
  fastify.post('/generate', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new BriefingService(creatorId);

    const briefing = await service.generate();

    return { briefing };
  });

  // POST /api/briefing/:id/read
  fastify.post('/:id/read', async (request) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const service = new BriefingService(creatorId);

    await service.markAsRead(id);

    return { success: true };
  });
};
