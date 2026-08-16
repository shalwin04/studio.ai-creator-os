/**
 * Memory Routes
 *
 * Creator memory: semantic search, manual save, preference updates.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { MemoryService } from '../../services/agent/memory/index.js';

const saveMemorySchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['episodic', 'semantic', 'procedural']),
  metadata: z.record(z.any()).default({}),
});

const searchMemorySchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().min(1).max(20).default(5),
});

const contextSchema = z.object({
  message: z.string().min(1),
  limit: z.coerce.number().min(1).max(20).default(5),
});

const updateCreatorMemorySchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const memoryRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/memory
  fastify.post('/', async (request) => {
    const creatorId = request.user!.creatorId;
    const body = saveMemorySchema.parse(request.body);
    const service = new MemoryService(creatorId);

    await service.saveMemory(body.content, body.type, body.metadata);

    return { success: true };
  });

  // GET /api/memory/search?query=...&limit=...
  fastify.get('/search', async (request) => {
    const creatorId = request.user!.creatorId;
    const query = searchMemorySchema.parse(request.query);
    const service = new MemoryService(creatorId);

    const memories = await service.searchMemories(query.query, query.limit);

    return { memories };
  });

  // GET /api/memory/context?message=...&limit=...
  fastify.get('/context', async (request) => {
    const creatorId = request.user!.creatorId;
    const query = contextSchema.parse(request.query);
    const service = new MemoryService(creatorId);

    const context = await service.retrieveContext(query.message, { limit: query.limit });

    return { context };
  });

  // PATCH /api/memory/preferences
  fastify.patch('/preferences', async (request) => {
    const creatorId = request.user!.creatorId;
    const body = updateCreatorMemorySchema.parse(request.body);
    const service = new MemoryService(creatorId);

    await service.updateCreatorMemory(body.key, body.value, body.confidence);

    return { success: true };
  });

  // POST /api/memory/consolidate
  fastify.post('/consolidate', async (request) => {
    const creatorId = request.user!.creatorId;
    const service = new MemoryService(creatorId);

    await service.consolidateMemories();

    return { success: true };
  });
};
