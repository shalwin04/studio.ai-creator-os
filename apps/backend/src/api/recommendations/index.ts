/**
 * Recommendations Routes
 *
 * Highest-impact next actions, ranked.
 */

import { FastifyPluginAsync } from 'fastify';
import { ImpactService } from '../../services/impact/index.js';

export const recommendationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/recommendations
  fastify.get('/', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new ImpactService(creatorId);

    const scores = await service.calculateDaily();

    return { recommendations: scores };
  });

  // GET /api/recommendations/top
  fastify.get('/top', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new ImpactService(creatorId);

    const top = await service.getTopRecommendation();

    return { recommendation: top };
  });
};
