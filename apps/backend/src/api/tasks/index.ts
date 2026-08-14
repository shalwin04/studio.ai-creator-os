/**
 * Tasks Routes
 *
 * Task management CRUD endpoints.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '../../lib/database.js';
import { tasks } from '../../db/schema.js';

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
});

const listTasksQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const setReminderSchema = z.object({
  reminderAt: z.string().datetime().nullable(),
});

export const taskRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/tasks
  fastify.get('/', async (request) => {
    const creatorId = request.user!.creatorId;
    const query = listTasksQuerySchema.parse(request.query);
    const db = getDb();

    const conditions = [eq(tasks.creatorId, creatorId)];
    if (query.status) conditions.push(eq(tasks.status, query.status));
    if (query.priority) conditions.push(eq(tasks.priority, query.priority));

    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    return { tasks: results };
  });

  // POST /api/tasks
  fastify.post('/', async (request) => {
    const creatorId = request.user!.creatorId;
    const body = createTaskSchema.parse(request.body);
    const db = getDb();

    const [task] = await db
      .insert(tasks)
      .values({
        creatorId,
        title: body.title,
        description: body.description,
        priority: body.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        tags: body.tags,
      })
      .returning();

    return { task };
  });

  // GET /api/tasks/:id
  fastify.get('/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const task = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.creatorId, creatorId)),
    });

    if (!task) {
      return reply.status(404).send({ error: 'NotFound', message: 'Task not found' });
    }

    return { task };
  });

  // PATCH /api/tasks/:id
  fastify.patch('/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const body = updateTaskSchema.parse(request.body);
    const db = getDb();

    const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.dueDate !== undefined) {
      updates.dueDate = new Date(body.dueDate);
    }
    if (body.status === 'completed') {
      updates.completedAt = new Date();
    } else if (body.status) {
      updates.completedAt = null;
    }

    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.creatorId, creatorId)))
      .returning();

    if (!task) {
      return reply.status(404).send({ error: 'NotFound', message: 'Task not found' });
    }

    return { task };
  });

  // DELETE /api/tasks/:id
  fastify.delete('/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.creatorId, creatorId)))
      .returning({ id: tasks.id });

    if (!deleted) {
      return reply.status(404).send({ error: 'NotFound', message: 'Task not found' });
    }

    return { success: true };
  });

  // POST /api/tasks/:id/reminder
  fastify.post('/:id/reminder', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const body = setReminderSchema.parse(request.body);
    const db = getDb();

    const [task] = await db
      .update(tasks)
      .set({
        reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.creatorId, creatorId)))
      .returning();

    if (!task) {
      return reply.status(404).send({ error: 'NotFound', message: 'Task not found' });
    }

    return { reminder: task.reminderAt };
  });
};
