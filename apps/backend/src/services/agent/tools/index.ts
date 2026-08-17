/**
 * Tool Registry
 *
 * Manages available agent tools and their execution. Every tool here is
 * backed by the real database (via Drizzle) or an existing service —
 * nothing here is a stub.
 */

import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { getDb } from '../../../lib/database.js';
import {
  tasks,
  contentIdeas,
  contentPipeline,
  sponsorships,
  sponsorshipDeliverables,
} from '../../../db/schema.js';
import { MemoryService } from '../memory/index.js';
import { ImpactService } from '../../impact/index.js';
import { ContentIntelligenceService } from '../../content/index.js';
import { YouTubeService } from '../../youtube/index.js';
import { WorkflowService } from '../../workflow/index.js';

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  creatorId: string;
  conversationId: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Task tools
    this.register(createTaskTool);
    this.register(listTasksTool);
    this.register(updateTaskTool);
    this.register(setReminderTool);

    // Analytics tools
    this.register(getVideoPerformanceTool);
    this.register(getChannelStatsTool);
    this.register(compareVideosTool);

    // Content tools
    this.register(generateIdeasTool);
    this.register(listIdeasTool);
    this.register(updateIdeaTool);
    this.register(getPipelineTool);

    // Calendar tools
    this.register(getEventsTool);
    this.register(addEventTool);
    this.register(findSlotsTool);
    this.register(scheduleContentTool);

    // Sponsor tools
    this.register(listDealsTool);
    this.register(getDeliverablesTool);
    this.register(trackDealStatusTool);

    // Impact tools
    this.register(calculateImpactTool);
    this.register(getRecommendationTool);

    // Memory tools
    this.register(saveMemoryTool);
    this.register(queryMemoryTool);

    // Workflow tools
    this.register(triggerWorkflowTool);
  }

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  async execute(name: string, args: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool not found: ${name}` };
    }

    try {
      return await tool.execute(args, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

// ============ TASK TOOLS ============

const createTaskTool: Tool = {
  name: 'createTask',
  description: 'Create a new task for the creator',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      dueDate: { type: 'string', format: 'date-time' },
    },
    required: ['title'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const [task] = await db
      .insert(tasks)
      .values({
        creatorId: context.creatorId,
        title: args.title,
        description: args.description,
        priority: args.priority ?? 'medium',
        dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
      })
      .returning();
    return { success: true, data: task };
  },
};

const listTasksTool: Tool = {
  name: 'listTasks',
  description: 'List tasks with optional filters',
  parameters: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      limit: { type: 'number' },
    },
  },
  execute: async (args, context) => {
    const db = getDb();
    const conditions = [eq(tasks.creatorId, context.creatorId)];
    if (args.status) conditions.push(eq(tasks.status, args.status));
    if (args.priority) conditions.push(eq(tasks.priority, args.priority));

    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(args.limit ?? 20);

    return { success: true, data: results };
  },
};

const updateTaskTool: Tool = {
  name: 'updateTask',
  description: 'Update an existing task (status, progress, etc.)',
  parameters: {
    type: 'object',
    properties: {
      taskId: { type: 'string' },
      status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
      progress: { type: 'number' },
    },
    required: ['taskId'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (args.status) {
      updates.status = args.status;
      updates.completedAt = args.status === 'completed' ? new Date() : null;
    }
    if (typeof args.progress === 'number') updates.progress = args.progress;

    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, args.taskId), eq(tasks.creatorId, context.creatorId)))
      .returning();

    if (!task) return { success: false, error: 'Task not found' };
    return { success: true, data: task };
  },
};

const setReminderTool: Tool = {
  name: 'setReminder',
  description: 'Set or clear a reminder time on a task',
  parameters: {
    type: 'object',
    properties: {
      taskId: { type: 'string' },
      reminderAt: { type: 'string', format: 'date-time' },
    },
    required: ['taskId'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const [task] = await db
      .update(tasks)
      .set({ reminderAt: args.reminderAt ? new Date(args.reminderAt) : null, updatedAt: new Date() })
      .where(and(eq(tasks.id, args.taskId), eq(tasks.creatorId, context.creatorId)))
      .returning();

    if (!task) return { success: false, error: 'Task not found' };
    return { success: true, data: { reminderAt: task.reminderAt } };
  },
};

// ============ ANALYTICS TOOLS ============

const getVideoPerformanceTool: Tool = {
  name: 'getVideoPerformance',
  description: 'Get performance metrics (views, likes, retention) for a specific video',
  parameters: {
    type: 'object',
    properties: {
      videoId: { type: 'string', description: 'The internal video id, not the YouTube video id' },
    },
    required: ['videoId'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const video = await db.query.youtubeVideos.findFirst({
      where: (v, { eq: e }) => e(v.id, args.videoId),
    });
    if (!video) return { success: false, error: 'Video not found' };

    const analytics = await db.query.videoAnalytics.findMany({
      where: (a, { eq: e }) => e(a.videoId, args.videoId),
      orderBy: (a, { asc }) => asc(a.date),
    });

    return { success: true, data: { video, analytics } };
  },
};

const getChannelStatsTool: Tool = {
  name: 'getChannelStats',
  description: "Get the creator's connected YouTube channel statistics",
  parameters: { type: 'object', properties: {} },
  execute: async (_args, context) => {
    const db = getDb();
    const channel = await db.query.youtubeChannels.findFirst({
      where: (c, { eq: e }) => e(c.creatorId, context.creatorId),
    });
    if (!channel) return { success: false, error: 'YouTube channel not connected' };
    return { success: true, data: channel };
  },
};

const compareVideosTool: Tool = {
  name: 'compareVideos',
  description: "Compare two of the creator's videos by view count, likes, and comments",
  parameters: {
    type: 'object',
    properties: {
      videoIdA: { type: 'string' },
      videoIdB: { type: 'string' },
    },
    required: ['videoIdA', 'videoIdB'],
  },
  execute: async (args) => {
    const db = getDb();
    const [a, b] = await Promise.all([
      db.query.youtubeVideos.findFirst({ where: (v, { eq: e }) => e(v.id, args.videoIdA) }),
      db.query.youtubeVideos.findFirst({ where: (v, { eq: e }) => e(v.id, args.videoIdB) }),
    ]);
    if (!a || !b) return { success: false, error: 'One or both videos not found' };
    return { success: true, data: { a, b } };
  },
};

// ============ CONTENT TOOLS ============

const generateIdeasTool: Tool = {
  name: 'generateIdeas',
  description: "Generate new AI video ideas based on the creator's channel and goals, and save them",
  parameters: {
    type: 'object',
    properties: {
      count: { type: 'number', default: 5 },
    },
  },
  execute: async (args, context) => {
    const service = new ContentIntelligenceService(context.creatorId);
    const ideas = await service.generateIdeas(args.count ?? 5);
    return { success: true, data: ideas };
  },
};

const listIdeasTool: Tool = {
  name: 'listIdeas',
  description: 'List content ideas, optionally filtered by status',
  parameters: {
    type: 'object',
    properties: {
      status: { type: 'string' },
      limit: { type: 'number' },
    },
  },
  execute: async (args, context) => {
    const db = getDb();
    const conditions = [eq(contentIdeas.creatorId, context.creatorId)];
    if (args.status) conditions.push(eq(contentIdeas.status, args.status));

    const ideas = await db
      .select()
      .from(contentIdeas)
      .where(and(...conditions))
      .orderBy(desc(contentIdeas.createdAt))
      .limit(args.limit ?? 20);

    return { success: true, data: ideas };
  },
};

const updateIdeaTool: Tool = {
  name: 'updateIdea',
  description: "Update a content idea's status or notes",
  parameters: {
    type: 'object',
    properties: {
      ideaId: { type: 'string' },
      status: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['ideaId'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (args.status) updates.status = args.status;
    if (args.notes) updates.notes = args.notes;

    const [idea] = await db
      .update(contentIdeas)
      .set(updates)
      .where(and(eq(contentIdeas.id, args.ideaId), eq(contentIdeas.creatorId, context.creatorId)))
      .returning();

    if (!idea) return { success: false, error: 'Idea not found' };
    return { success: true, data: idea };
  },
};

const getPipelineTool: Tool = {
  name: 'getPipeline',
  description: "Get the creator's content production pipeline (planning → published)",
  parameters: {
    type: 'object',
    properties: {
      status: { type: 'string' },
    },
  },
  execute: async (args, context) => {
    const db = getDb();
    const conditions = [eq(contentPipeline.creatorId, context.creatorId)];
    if (args.status) conditions.push(eq(contentPipeline.status, args.status));

    const items = await db
      .select()
      .from(contentPipeline)
      .where(and(...conditions))
      .orderBy(desc(contentPipeline.createdAt));

    return { success: true, data: items };
  },
};

// ============ CALENDAR TOOLS ============
// There's no standalone calendar table — "events" are the union of task due
// dates, sponsorship deliverable due dates, and scheduled pipeline items.

const getEventsTool: Tool = {
  name: 'getEvents',
  description: 'Get upcoming scheduled events: task due dates, content publish dates, sponsor deliverables',
  parameters: {
    type: 'object',
    properties: {
      fromDate: { type: 'string', format: 'date-time' },
      toDate: { type: 'string', format: 'date-time' },
    },
  },
  execute: async (args, context) => {
    const db = getDb();
    const from = args.fromDate ? new Date(args.fromDate) : new Date();
    const to = args.toDate ? new Date(args.toDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [dueTasks, scheduledContent, deliverables] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.creatorId, context.creatorId), gte(tasks.dueDate, from), lte(tasks.dueDate, to))),
      db
        .select()
        .from(contentPipeline)
        .where(
          and(
            eq(contentPipeline.creatorId, context.creatorId),
            gte(contentPipeline.scheduledDate, from),
            lte(contentPipeline.scheduledDate, to)
          )
        ),
      db
        .select({ deliverable: sponsorshipDeliverables, sponsorship: sponsorships })
        .from(sponsorshipDeliverables)
        .innerJoin(sponsorships, eq(sponsorshipDeliverables.sponsorshipId, sponsorships.id))
        .where(
          and(
            eq(sponsorships.creatorId, context.creatorId),
            gte(sponsorshipDeliverables.dueDate, from),
            lte(sponsorshipDeliverables.dueDate, to)
          )
        ),
    ]);

    const events = [
      ...dueTasks.map((t) => ({ type: 'task', id: t.id, title: t.title, date: t.dueDate })),
      ...scheduledContent.map((c) => ({ type: 'content', id: c.id, title: c.title, date: c.scheduledDate })),
      ...deliverables.map((d) => ({
        type: 'deliverable',
        id: d.deliverable.id,
        title: `${d.deliverable.title} (${d.sponsorship.brandName})`,
        date: d.deliverable.dueDate,
      })),
    ].sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());

    return { success: true, data: events };
  },
};

const addEventTool: Tool = {
  name: 'addEvent',
  description: 'Add a scheduled event. Creates a task with a due date.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      description: { type: 'string' },
    },
    required: ['title', 'date'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const [task] = await db
      .insert(tasks)
      .values({
        creatorId: context.creatorId,
        title: args.title,
        description: args.description,
        dueDate: new Date(args.date),
      })
      .returning();
    return { success: true, data: task };
  },
};

const findSlotsTool: Tool = {
  name: 'findSlots',
  description: 'Find free days in the next N days with no scheduled tasks, content, or deliverables',
  parameters: {
    type: 'object',
    properties: {
      days: { type: 'number', default: 14 },
    },
  },
  execute: async (args, context) => {
    const days = args.days ?? 14;
    const events = await getEventsTool.execute(
      { toDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() },
      context
    );
    if (!events.success) return events;

    const busyDates = new Set(
      (events.data as any[]).map((e) => new Date(e.date).toISOString().slice(0, 10))
    );

    const freeSlots: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (!busyDates.has(date)) freeSlots.push(date);
    }

    return { success: true, data: freeSlots };
  },
};

const scheduleContentTool: Tool = {
  name: 'scheduleContent',
  description: 'Schedule a content pipeline item (or a new idea) for a publish date',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      ideaId: { type: 'string' },
      scheduledDate: { type: 'string', format: 'date-time' },
    },
    required: ['title', 'scheduledDate'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const [item] = await db
      .insert(contentPipeline)
      .values({
        creatorId: context.creatorId,
        ideaId: args.ideaId,
        title: args.title,
        scheduledDate: new Date(args.scheduledDate),
      })
      .returning();
    return { success: true, data: item };
  },
};

// ============ SPONSOR TOOLS ============

const listDealsTool: Tool = {
  name: 'listDeals',
  description: 'List sponsorship deals, optionally filtered by status',
  parameters: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['lead', 'negotiating', 'contracted', 'delivered', 'declined'] },
    },
  },
  execute: async (args, context) => {
    const db = getDb();
    const conditions = [eq(sponsorships.creatorId, context.creatorId)];
    if (args.status) conditions.push(eq(sponsorships.status, args.status));

    const deals = await db
      .select()
      .from(sponsorships)
      .where(and(...conditions))
      .orderBy(desc(sponsorships.createdAt));

    return { success: true, data: deals };
  },
};

const getDeliverablesTool: Tool = {
  name: 'getDeliverables',
  description: 'Get deliverables for a specific sponsorship deal',
  parameters: {
    type: 'object',
    properties: {
      sponsorshipId: { type: 'string' },
    },
    required: ['sponsorshipId'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const sponsorship = await db.query.sponsorships.findFirst({
      where: and(eq(sponsorships.id, args.sponsorshipId), eq(sponsorships.creatorId, context.creatorId)),
    });
    if (!sponsorship) return { success: false, error: 'Sponsorship not found' };

    const deliverables = await db
      .select()
      .from(sponsorshipDeliverables)
      .where(eq(sponsorshipDeliverables.sponsorshipId, args.sponsorshipId))
      .orderBy(desc(sponsorshipDeliverables.createdAt));

    return { success: true, data: deliverables };
  },
};

const trackDealStatusTool: Tool = {
  name: 'trackStatus',
  description: 'Update the status of a sponsorship deal (lead, negotiating, contracted, delivered, declined)',
  parameters: {
    type: 'object',
    properties: {
      sponsorshipId: { type: 'string' },
      status: { type: 'string', enum: ['lead', 'negotiating', 'contracted', 'delivered', 'declined'] },
    },
    required: ['sponsorshipId', 'status'],
  },
  execute: async (args, context) => {
    const db = getDb();
    const [sponsorship] = await db
      .update(sponsorships)
      .set({ status: args.status, updatedAt: new Date() })
      .where(and(eq(sponsorships.id, args.sponsorshipId), eq(sponsorships.creatorId, context.creatorId)))
      .returning();

    if (!sponsorship) return { success: false, error: 'Sponsorship not found' };
    return { success: true, data: sponsorship };
  },
};

// ============ IMPACT TOOLS ============

const calculateImpactTool: Tool = {
  name: 'calculateImpact',
  description: 'Recalculate impact scores across all pending tasks, ideas, and sponsorships',
  parameters: { type: 'object', properties: {} },
  execute: async (_args, context) => {
    const service = new ImpactService(context.creatorId);
    const scores = await service.calculateDaily();
    return { success: true, data: scores };
  },
};

const getRecommendationTool: Tool = {
  name: 'getRecommendation',
  description: "Get today's single highest-impact recommended action",
  parameters: { type: 'object', properties: {} },
  execute: async (_args, context) => {
    const service = new ImpactService(context.creatorId);
    let top = await service.getTopRecommendation();
    if (!top) {
      await service.calculateDaily();
      top = await service.getTopRecommendation();
    }
    return { success: true, data: top };
  },
};

// ============ MEMORY TOOLS ============

const saveMemoryTool: Tool = {
  name: 'saveMemory',
  description: "Save a fact, preference, or workflow pattern to the creator's long-term memory",
  parameters: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      type: { type: 'string', enum: ['episodic', 'semantic', 'procedural'] },
    },
    required: ['content'],
  },
  execute: async (args, context) => {
    const service = new MemoryService(context.creatorId);
    await service.saveMemory(args.content, args.type ?? 'semantic');
    return { success: true, data: { saved: true } };
  },
};

const queryMemoryTool: Tool = {
  name: 'queryMemory',
  description: "Search the creator's long-term memory by semantic similarity",
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'number' },
    },
    required: ['query'],
  },
  execute: async (args, context) => {
    const service = new MemoryService(context.creatorId);
    const results = await service.searchMemories(args.query, args.limit ?? 5);
    return { success: true, data: results };
  },
};

// ============ WORKFLOW TOOLS ============

const triggerWorkflowTool: Tool = {
  name: 'triggerWorkflow',
  description: 'Run a saved custom workflow by name',
  parameters: {
    type: 'object',
    properties: {
      workflowName: { type: 'string' },
    },
    required: ['workflowName'],
  },
  execute: async (args, context) => {
    const service = new WorkflowService(context.creatorId);
    const workflow = await service.findByName(args.workflowName);
    if (!workflow) return { success: false, error: `No workflow named "${args.workflowName}"` };

    const run = await service.execute(workflow.id, 'chat');
    return { success: run.status === 'completed', data: run };
  },
};
