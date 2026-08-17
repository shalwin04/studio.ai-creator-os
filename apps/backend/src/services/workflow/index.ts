/**
 * Workflow Service
 *
 * Custom, saveable, chat-triggerable automations. A workflow is an ordered
 * list of tool calls; running it executes each step through the agent's
 * ToolRegistry in sequence, allowing `{{stepN.field}}` placeholders in a
 * step's args to be resolved from a previous step's result.
 */

import { desc, eq, and, ilike } from 'drizzle-orm';
import { getDb } from '../../lib/database.js';
import { workflows, workflowRuns } from '../../db/schema.js';
import { ToolRegistry } from '../agent/tools/index.js';

export interface WorkflowStep {
  tool: string;
  args: Record<string, any>;
}

export interface WorkflowStepResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
}

const PLACEHOLDER_RE = /\{\{step(\d+)\.([\w.]+)\}\}/g;

function resolvePlaceholders(value: any, priorResults: WorkflowStepResult[]): any {
  if (typeof value === 'string') {
    return value.replace(PLACEHOLDER_RE, (_match, stepIndex, path) => {
      const result = priorResults[Number(stepIndex)];
      if (!result) return _match;
      const resolved = path.split('.').reduce((acc: any, key: string) => acc?.[key], result.data);
      return resolved !== undefined ? String(resolved) : _match;
    });
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolvePlaceholders(v, priorResults));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolvePlaceholders(v, priorResults)])
    );
  }
  return value;
}

export class WorkflowService {
  private creatorId: string;
  private toolRegistry: ToolRegistry;

  constructor(creatorId: string) {
    this.creatorId = creatorId;
    this.toolRegistry = new ToolRegistry();
  }

  async list() {
    const db = getDb();
    return db
      .select()
      .from(workflows)
      .where(eq(workflows.creatorId, this.creatorId))
      .orderBy(desc(workflows.createdAt));
  }

  async get(id: string) {
    const db = getDb();
    return db.query.workflows.findFirst({
      where: and(eq(workflows.id, id), eq(workflows.creatorId, this.creatorId)),
    });
  }

  async findByName(name: string) {
    const db = getDb();
    return db.query.workflows.findFirst({
      where: and(
        eq(workflows.creatorId, this.creatorId),
        eq(workflows.isActive, true),
        ilike(workflows.name, name)
      ),
    });
  }

  async create(input: { name: string; description?: string; steps: WorkflowStep[]; triggerPhrase?: string }) {
    const db = getDb();
    const [workflow] = await db
      .insert(workflows)
      .values({
        creatorId: this.creatorId,
        name: input.name,
        description: input.description,
        steps: input.steps,
        triggerPhrase: input.triggerPhrase,
      })
      .returning();
    return workflow;
  }

  async update(
    id: string,
    input: Partial<{ name: string; description: string; steps: WorkflowStep[]; triggerPhrase: string; isActive: boolean }>
  ) {
    const db = getDb();
    const [workflow] = await db
      .update(workflows)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(workflows.id, id), eq(workflows.creatorId, this.creatorId)))
      .returning();
    return workflow ?? null;
  }

  async delete(id: string) {
    const db = getDb();
    const [deleted] = await db
      .delete(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.creatorId, this.creatorId)))
      .returning({ id: workflows.id });
    return !!deleted;
  }

  /**
   * Execute a saved workflow's steps in order through the ToolRegistry.
   * A failed step aborts the run but preserves partial results.
   */
  async execute(workflowId: string, triggeredBy: 'manual' | 'chat' = 'manual') {
    const db = getDb();
    const workflow = await this.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const [run] = await db
      .insert(workflowRuns)
      .values({ workflowId, creatorId: this.creatorId, status: 'running', triggeredBy })
      .returning();

    if (!run) throw new Error('Failed to create workflow run');

    const steps = workflow.steps as WorkflowStep[];
    const results: WorkflowStepResult[] = [];
    let status: 'completed' | 'failed' = 'completed';
    let error: string | undefined;

    for (const step of steps) {
      const resolvedArgs = resolvePlaceholders(step.args, results);
      const result = await this.toolRegistry.execute(step.tool, resolvedArgs, {
        creatorId: this.creatorId,
        conversationId: run.id,
      });
      results.push({ tool: step.tool, success: result.success, data: result.data, error: result.error });

      if (!result.success) {
        status = 'failed';
        error = result.error;
        break;
      }
    }

    const [updatedRun] = await db
      .update(workflowRuns)
      .set({ status, stepResults: results, error, completedAt: new Date() })
      .where(eq(workflowRuns.id, run.id))
      .returning();

    await db.update(workflows).set({ lastRunAt: new Date() }).where(eq(workflows.id, workflowId));

    return updatedRun ?? { ...run, status, stepResults: results, error };
  }

  async listRuns(workflowId: string) {
    const db = getDb();
    return db
      .select()
      .from(workflowRuns)
      .where(and(eq(workflowRuns.workflowId, workflowId), eq(workflowRuns.creatorId, this.creatorId)))
      .orderBy(desc(workflowRuns.startedAt));
  }
}
