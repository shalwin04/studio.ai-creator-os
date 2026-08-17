/**
 * Workflow Routes
 *
 * Create, save, list, and execute custom multi-step automations. Workflows
 * can also be triggered from chat via the `triggerWorkflow` agent tool.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { WorkflowService } from '../../services/workflow/index.js';

const stepSchema = z.object({
  tool: z.string().min(1),
  args: z.record(z.any()).default({}),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  steps: z.array(stepSchema).min(1).max(10),
  triggerPhrase: z.string().max(200).optional(),
});

const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

export const workflowRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/workflows
  fastify.get('/', async (request) => {
    const service = new WorkflowService(request.user!.creatorId);
    const items = await service.list();
    return { workflows: items };
  });

  // GET /api/workflows/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const service = new WorkflowService(request.user!.creatorId);
    const workflow = await service.get(id);

    if (!workflow) {
      return reply.status(404).send({ error: 'NotFound', message: 'Workflow not found' });
    }

    return { workflow };
  });

  // POST /api/workflows - create
  fastify.post('/', async (request) => {
    const body = createWorkflowSchema.parse(request.body);
    const service = new WorkflowService(request.user!.creatorId);
    const workflow = await service.create(body);
    return { workflow };
  });

  // PATCH /api/workflows/:id - save/update
  fastify.patch('/:id', async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const body = updateWorkflowSchema.parse(request.body);
    const service = new WorkflowService(request.user!.creatorId);
    const workflow = await service.update(id, body);

    if (!workflow) {
      return reply.status(404).send({ error: 'NotFound', message: 'Workflow not found' });
    }

    return { workflow };
  });

  // DELETE /api/workflows/:id
  fastify.delete('/:id', async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const service = new WorkflowService(request.user!.creatorId);
    const deleted = await service.delete(id);

    if (!deleted) {
      return reply.status(404).send({ error: 'NotFound', message: 'Workflow not found' });
    }

    return { success: true };
  });

  // POST /api/workflows/:id/execute
  fastify.post('/:id/execute', async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const service = new WorkflowService(request.user!.creatorId);

    const workflow = await service.get(id);
    if (!workflow) {
      return reply.status(404).send({ error: 'NotFound', message: 'Workflow not found' });
    }

    const run = await service.execute(id, 'manual');
    return { run };
  });

  // GET /api/workflows/:id/runs
  fastify.get('/:id/runs', async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const service = new WorkflowService(request.user!.creatorId);

    const workflow = await service.get(id);
    if (!workflow) {
      return reply.status(404).send({ error: 'NotFound', message: 'Workflow not found' });
    }

    const runs = await service.listRuns(id);
    return { runs };
  });
};
