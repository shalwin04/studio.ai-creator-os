/**
 * Content Routes
 *
 * Content ideas, pipeline, and sponsorship management.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '../../lib/database.js';
import {
  contentIdeas,
  contentPipeline,
  sponsorships,
  sponsorshipDeliverables,
} from '../../db/schema.js';

const idParamsSchema = z.object({ id: z.string().uuid() });
const deliverableParamsSchema = z.object({
  id: z.string().uuid(),
  deliverableId: z.string().uuid(),
});

// ===== IDEAS =====

const createIdeaSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  source: z.string().max(200).optional(),
  sourceReference: z.string().max(1000).optional(),
  format: z.string().max(50).default('long_form'),
  tags: z.array(z.string()).default([]),
  estimatedEffort: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
});

const updateIdeaSchema = createIdeaSchema.partial().extend({
  status: z.string().min(1).max(50).optional(),
});

const listIdeasQuerySchema = z.object({
  status: z.string().optional(),
});

// ===== PIPELINE =====

const createPipelineSchema = z.object({
  ideaId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
  checklist: z.array(z.unknown()).optional(),
});

const updatePipelineSchema = createPipelineSchema.partial().extend({
  status: z.string().min(1).max(50).optional(),
  progress: z.number().min(0).max(100).optional(),
  publishedVideoId: z.string().uuid().optional(),
});

const listPipelineQuerySchema = z.object({
  status: z.string().optional(),
});

// ===== SPONSORSHIPS =====

const createSponsorshipSchema = z.object({
  brandName: z.string().min(1).max(300),
  contactName: z.string().max(200).optional(),
  contactEmail: z.string().email().optional(),
  dealValue: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('USD'),
  contractUrl: z.string().url().optional(),
  notes: z.string().max(5000).optional(),
});

const updateSponsorshipSchema = createSponsorshipSchema.partial().extend({
  status: z.string().min(1).max(50).optional(),
});

const createDeliverableSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  type: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  linkedVideoId: z.string().uuid().optional(),
});

const updateDeliverableSchema = createDeliverableSchema.partial().extend({
  status: z.string().min(1).max(50).optional(),
});

export const contentRoutes: FastifyPluginAsync = async (fastify) => {
  // === IDEAS ===

  // GET /api/content/ideas
  fastify.get('/ideas', async (request) => {
    const creatorId = request.user!.creatorId;
    const query = listIdeasQuerySchema.parse(request.query);
    const db = getDb();

    const conditions = [eq(contentIdeas.creatorId, creatorId)];
    if (query.status) conditions.push(eq(contentIdeas.status, query.status));

    const ideas = await db
      .select()
      .from(contentIdeas)
      .where(and(...conditions))
      .orderBy(desc(contentIdeas.createdAt));

    return { ideas };
  });

  // GET /api/content/ideas/:id
  fastify.get('/ideas/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const idea = await db.query.contentIdeas.findFirst({
      where: and(eq(contentIdeas.id, id), eq(contentIdeas.creatorId, creatorId)),
    });

    if (!idea) {
      return reply.status(404).send({ error: 'NotFound', message: 'Idea not found' });
    }

    return { idea };
  });

  // POST /api/content/ideas
  fastify.post('/ideas', async (request) => {
    const creatorId = request.user!.creatorId;
    const body = createIdeaSchema.parse(request.body);
    const db = getDb();

    const [idea] = await db
      .insert(contentIdeas)
      .values({ creatorId, ...body })
      .returning();

    return { idea };
  });

  // POST /api/content/ideas/generate
  fastify.post('/ideas/generate', async (request, reply) => {
    return reply.status(501).send({
      error: 'NotImplemented',
      message: 'AI idea generation is not implemented yet',
    });
  });

  // PATCH /api/content/ideas/:id
  fastify.patch('/ideas/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const body = updateIdeaSchema.parse(request.body);
    const db = getDb();

    const [idea] = await db
      .update(contentIdeas)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(contentIdeas.id, id), eq(contentIdeas.creatorId, creatorId)))
      .returning();

    if (!idea) {
      return reply.status(404).send({ error: 'NotFound', message: 'Idea not found' });
    }

    return { idea };
  });

  // DELETE /api/content/ideas/:id
  fastify.delete('/ideas/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const [deleted] = await db
      .delete(contentIdeas)
      .where(and(eq(contentIdeas.id, id), eq(contentIdeas.creatorId, creatorId)))
      .returning({ id: contentIdeas.id });

    if (!deleted) {
      return reply.status(404).send({ error: 'NotFound', message: 'Idea not found' });
    }

    return { success: true };
  });

  // === PIPELINE ===

  // GET /api/content/pipeline
  fastify.get('/pipeline', async (request) => {
    const creatorId = request.user!.creatorId;
    const query = listPipelineQuerySchema.parse(request.query);
    const db = getDb();

    const conditions = [eq(contentPipeline.creatorId, creatorId)];
    if (query.status) conditions.push(eq(contentPipeline.status, query.status));

    const items = await db
      .select()
      .from(contentPipeline)
      .where(and(...conditions))
      .orderBy(desc(contentPipeline.createdAt));

    return { items };
  });

  // POST /api/content/pipeline
  fastify.post('/pipeline', async (request) => {
    const creatorId = request.user!.creatorId;
    const body = createPipelineSchema.parse(request.body);
    const db = getDb();

    const [item] = await db
      .insert(contentPipeline)
      .values({
        creatorId,
        ideaId: body.ideaId,
        title: body.title,
        notes: body.notes,
        checklist: body.checklist,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
      })
      .returning();

    return { item };
  });

  // PATCH /api/content/pipeline/:id
  fastify.patch('/pipeline/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const body = updatePipelineSchema.parse(request.body);
    const db = getDb();

    const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.scheduledDate !== undefined) {
      updates.scheduledDate = new Date(body.scheduledDate);
    }

    const [item] = await db
      .update(contentPipeline)
      .set(updates)
      .where(and(eq(contentPipeline.id, id), eq(contentPipeline.creatorId, creatorId)))
      .returning();

    if (!item) {
      return reply.status(404).send({ error: 'NotFound', message: 'Pipeline item not found' });
    }

    return { item };
  });

  // DELETE /api/content/pipeline/:id
  fastify.delete('/pipeline/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const [deleted] = await db
      .delete(contentPipeline)
      .where(and(eq(contentPipeline.id, id), eq(contentPipeline.creatorId, creatorId)))
      .returning({ id: contentPipeline.id });

    if (!deleted) {
      return reply.status(404).send({ error: 'NotFound', message: 'Pipeline item not found' });
    }

    return { success: true };
  });

  // === SPONSORSHIPS ===

  // GET /api/content/sponsorships
  fastify.get('/sponsorships', async (request) => {
    const creatorId = request.user!.creatorId;
    const db = getDb();

    const items = await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.creatorId, creatorId))
      .orderBy(desc(sponsorships.createdAt));

    return { sponsorships: items };
  });

  // GET /api/content/sponsorships/:id
  fastify.get('/sponsorships/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const sponsorship = await db.query.sponsorships.findFirst({
      where: and(eq(sponsorships.id, id), eq(sponsorships.creatorId, creatorId)),
    });

    if (!sponsorship) {
      return reply.status(404).send({ error: 'NotFound', message: 'Sponsorship not found' });
    }

    return { sponsorship };
  });

  // POST /api/content/sponsorships
  fastify.post('/sponsorships', async (request) => {
    const creatorId = request.user!.creatorId;
    const body = createSponsorshipSchema.parse(request.body);
    const db = getDb();

    const [sponsorship] = await db
      .insert(sponsorships)
      .values({
        creatorId,
        brandName: body.brandName,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        dealValue: body.dealValue !== undefined ? String(body.dealValue) : undefined,
        currency: body.currency,
        contractUrl: body.contractUrl,
        notes: body.notes,
      })
      .returning();

    return { sponsorship };
  });

  // PATCH /api/content/sponsorships/:id
  fastify.patch('/sponsorships/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const body = updateSponsorshipSchema.parse(request.body);
    const db = getDb();

    const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.dealValue !== undefined) {
      updates.dealValue = String(body.dealValue);
    }

    const [sponsorship] = await db
      .update(sponsorships)
      .set(updates)
      .where(and(eq(sponsorships.id, id), eq(sponsorships.creatorId, creatorId)))
      .returning();

    if (!sponsorship) {
      return reply.status(404).send({ error: 'NotFound', message: 'Sponsorship not found' });
    }

    return { sponsorship };
  });

  // DELETE /api/content/sponsorships/:id
  fastify.delete('/sponsorships/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const [deleted] = await db
      .delete(sponsorships)
      .where(and(eq(sponsorships.id, id), eq(sponsorships.creatorId, creatorId)))
      .returning({ id: sponsorships.id });

    if (!deleted) {
      return reply.status(404).send({ error: 'NotFound', message: 'Sponsorship not found' });
    }

    return { success: true };
  });

  // GET /api/content/sponsorships/:id/deliverables
  fastify.get('/sponsorships/:id/deliverables', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const sponsorship = await db.query.sponsorships.findFirst({
      where: and(eq(sponsorships.id, id), eq(sponsorships.creatorId, creatorId)),
    });

    if (!sponsorship) {
      return reply.status(404).send({ error: 'NotFound', message: 'Sponsorship not found' });
    }

    const deliverables = await db
      .select()
      .from(sponsorshipDeliverables)
      .where(eq(sponsorshipDeliverables.sponsorshipId, id))
      .orderBy(desc(sponsorshipDeliverables.createdAt));

    return { deliverables };
  });

  // POST /api/content/sponsorships/:id/deliverables
  fastify.post('/sponsorships/:id/deliverables', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const body = createDeliverableSchema.parse(request.body);
    const db = getDb();

    const sponsorship = await db.query.sponsorships.findFirst({
      where: and(eq(sponsorships.id, id), eq(sponsorships.creatorId, creatorId)),
    });

    if (!sponsorship) {
      return reply.status(404).send({ error: 'NotFound', message: 'Sponsorship not found' });
    }

    const [deliverable] = await db
      .insert(sponsorshipDeliverables)
      .values({
        sponsorshipId: id,
        title: body.title,
        description: body.description,
        type: body.type,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        linkedVideoId: body.linkedVideoId,
      })
      .returning();

    return { deliverable };
  });

  // PATCH /api/content/sponsorships/:id/deliverables/:deliverableId
  fastify.patch('/sponsorships/:id/deliverables/:deliverableId', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id, deliverableId } = deliverableParamsSchema.parse(request.params);
    const body = updateDeliverableSchema.parse(request.body);
    const db = getDb();

    const sponsorship = await db.query.sponsorships.findFirst({
      where: and(eq(sponsorships.id, id), eq(sponsorships.creatorId, creatorId)),
    });

    if (!sponsorship) {
      return reply.status(404).send({ error: 'NotFound', message: 'Sponsorship not found' });
    }

    const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.dueDate !== undefined) {
      updates.dueDate = new Date(body.dueDate);
    }

    const [deliverable] = await db
      .update(sponsorshipDeliverables)
      .set(updates)
      .where(
        and(
          eq(sponsorshipDeliverables.id, deliverableId),
          eq(sponsorshipDeliverables.sponsorshipId, id)
        )
      )
      .returning();

    if (!deliverable) {
      return reply.status(404).send({ error: 'NotFound', message: 'Deliverable not found' });
    }

    return { deliverable };
  });

  // DELETE /api/content/sponsorships/:id/deliverables/:deliverableId
  fastify.delete('/sponsorships/:id/deliverables/:deliverableId', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id, deliverableId } = deliverableParamsSchema.parse(request.params);
    const db = getDb();

    const sponsorship = await db.query.sponsorships.findFirst({
      where: and(eq(sponsorships.id, id), eq(sponsorships.creatorId, creatorId)),
    });

    if (!sponsorship) {
      return reply.status(404).send({ error: 'NotFound', message: 'Sponsorship not found' });
    }

    const [deleted] = await db
      .delete(sponsorshipDeliverables)
      .where(
        and(
          eq(sponsorshipDeliverables.id, deliverableId),
          eq(sponsorshipDeliverables.sponsorshipId, id)
        )
      )
      .returning({ id: sponsorshipDeliverables.id });

    if (!deleted) {
      return reply.status(404).send({ error: 'NotFound', message: 'Deliverable not found' });
    }

    return { success: true };
  });
};
