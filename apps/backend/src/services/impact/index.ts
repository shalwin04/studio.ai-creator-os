/**
 * Impact Service
 *
 * Calculates highest-impact action scores.
 */

import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '../../lib/database.js';
import { geminiFlash } from '../../lib/llm.js';
import {
  tasks,
  contentIdeas,
  sponsorships,
  creatorGoals,
  youtubeChannels,
  impactScores,
} from '../../db/schema.js';

export interface ImpactScore {
  entityType: 'task' | 'idea' | 'sponsorship';
  entityId: string;
  title: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  reasoning: string;
}

export interface ScoreBreakdown {
  urgency: number;      // 25% weight
  revenue: number;      // 20% weight
  audience: number;     // 20% weight
  goalAlignment: number; // 15% weight
  effort: number;       // 10% weight (inverse)
  momentum: number;     // 10% weight
}

const WEIGHTS = {
  urgency: 0.25,
  revenue: 0.20,
  audience: 0.20,
  goalAlignment: 0.15,
  effort: 0.10,
  momentum: 0.10,
};

interface CreatorContext {
  goals: (typeof creatorGoals.$inferSelect)[];
  subscriberCount: number;
}

const EFFORT_LEVEL_SCORE: Record<string, number> = {
  low: 0.9,
  medium: 0.6,
  high: 0.3,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export class ImpactService {
  private creatorId: string;

  constructor(creatorId: string) {
    this.creatorId = creatorId;
  }

  /**
   * Calculate daily impact scores for all entities
   */
  async calculateDaily(): Promise<ImpactScore[]> {
    const [tasksList, ideasList, sponsorshipsList] = await Promise.all([
      this.getPendingTasks(),
      this.getPendingIdeas(),
      this.getActiveSponsorships(),
    ]);

    const context = await this.getCreatorContext();

    const scores: ImpactScore[] = [];

    for (const task of tasksList) {
      scores.push(await this.calculateScore(task, 'task', context));
    }

    for (const idea of ideasList) {
      scores.push(await this.calculateScore(idea, 'idea', context));
    }

    for (const sponsorship of sponsorshipsList) {
      scores.push(await this.calculateScore(sponsorship, 'sponsorship', context));
    }

    scores.sort((a, b) => b.totalScore - a.totalScore);

    await this.saveScores(scores);

    return scores;
  }

  /**
   * Calculate score for a single entity
   */
  private async calculateScore(
    entity: any,
    type: 'task' | 'idea' | 'sponsorship',
    context: CreatorContext
  ): Promise<ImpactScore> {
    const breakdown: ScoreBreakdown = {
      urgency: this.calculateUrgency(entity, type),
      revenue: this.calculateRevenue(entity, type),
      audience: this.calculateAudience(entity, type, context),
      goalAlignment: this.calculateGoalAlignment(entity, context.goals),
      effort: this.calculateEffort(entity, type),
      momentum: this.calculateMomentum(entity, type),
    };

    const totalScore = Object.entries(WEIGHTS).reduce(
      (sum, [key, weight]) => sum + breakdown[key as keyof ScoreBreakdown] * weight * 100,
      0
    );

    return {
      entityType: type,
      entityId: entity.id,
      title: entity.title ?? entity.brandName,
      totalScore,
      breakdown,
      reasoning: await this.generateReasoning(entity, type, breakdown),
    };
  }

  private calculateUrgency(entity: any, type: string): number {
    const dueDate: Date | null = entity.dueDate ?? null;

    if (dueDate) {
      const daysUntil = (new Date(dueDate).getTime() - Date.now()) / DAY_MS;
      if (daysUntil < 0) return 1.0;
      if (daysUntil <= 1) return 0.9;
      if (daysUntil <= 3) return 0.7;
      if (daysUntil <= 7) return 0.5;
      return 0.3;
    }

    if (type === 'sponsorship') {
      const byStatus: Record<string, number> = {
        lead: 0.3,
        negotiating: 0.6,
        contracted: 0.8,
        delivered: 0.4,
      };
      return byStatus[entity.status] ?? 0.4;
    }

    if (type === 'task' && entity.priority === 'urgent') return 0.9;
    if (type === 'task' && entity.priority === 'high') return 0.7;

    return 0.3;
  }

  private calculateRevenue(entity: any, type: string): number {
    if (type === 'sponsorship') {
      const value = Number(entity.dealValue ?? 0);
      return Math.min(value / 10000, 1);
    }

    if (type === 'idea' && typeof entity.impactScore === 'number') {
      return Math.min(Math.max(entity.impactScore / 100, 0), 1);
    }

    if (type === 'task' && entity.relatedEntityType === 'sponsorship') {
      return 0.6;
    }

    return 0.2;
  }

  private calculateAudience(entity: any, type: string, context: CreatorContext): number {
    const scale = Math.min(context.subscriberCount / 100000, 1);

    if (type === 'idea') return 0.5 + scale * 0.5;
    if (type === 'sponsorship') return 0.3 + scale * 0.2;
    if (type === 'task' && entity.relatedEntityType === 'content') return 0.5 + scale * 0.3;

    return 0.2;
  }

  private calculateGoalAlignment(entity: any, goals: CreatorContext['goals']): number {
    if (goals.length === 0) return 0.5;

    const haystack = `${entity.title ?? ''} ${entity.description ?? ''} ${entity.brandName ?? ''}`.toLowerCase();
    const aligned = goals.some((goal) => {
      const needle = `${goal.title} ${goal.goalType ?? ''}`.toLowerCase();
      return needle
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .some((word) => haystack.includes(word));
    });

    return aligned ? 0.85 : 0.4;
  }

  private calculateEffort(entity: any, type: string): number {
    if (type === 'idea' && entity.estimatedEffort) {
      return EFFORT_LEVEL_SCORE[entity.estimatedEffort] ?? 0.5;
    }

    if (type === 'task') {
      if (entity.priority === 'urgent' || entity.priority === 'high') return 0.4;
      return 0.6;
    }

    if (type === 'sponsorship') {
      return entity.status === 'negotiating' ? 0.4 : 0.5;
    }

    return 0.5;
  }

  private calculateMomentum(entity: any, type: string): number {
    if (type === 'task') {
      return entity.status === 'in_progress' ? 0.7 : 0.4;
    }

    if (type === 'idea') {
      return entity.source === 'trend' || entity.source === 'comment_mining' ? 0.8 : 0.4;
    }

    if (type === 'sponsorship') {
      return entity.status === 'negotiating' ? 0.6 : 0.3;
    }

    return 0.4;
  }

  private async generateReasoning(
    entity: any,
    type: string,
    breakdown: ScoreBreakdown
  ): Promise<string> {
    const [topDriver, topValue] = Object.entries(breakdown).sort(([, a], [, b]) => b - a)[0] as [
      keyof ScoreBreakdown,
      number,
    ];
    const title = entity.title ?? entity.brandName ?? 'this item';

    try {
      const response = await geminiFlash.invoke(
        `In one short sentence, explain why "${title}" (a ${type}) is a high-impact next action. ` +
          `Its strongest driver is ${topDriver} (score ${topValue.toFixed(2)}). ` +
          `Be concrete and specific, no more than 25 words.`
      );
      const text = typeof response.content === 'string' ? response.content : String(response.content);
      return text.trim();
    } catch {
      return `Prioritized primarily due to its ${topDriver} score.`;
    }
  }

  private async getPendingTasks() {
    const db = getDb();
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.creatorId, this.creatorId), inArray(tasks.status, ['pending', 'in_progress'])));
  }

  private async getPendingIdeas() {
    const db = getDb();
    return db
      .select()
      .from(contentIdeas)
      .where(and(eq(contentIdeas.creatorId, this.creatorId), inArray(contentIdeas.status, ['new', 'shortlisted'])));
  }

  private async getActiveSponsorships() {
    const db = getDb();
    return db
      .select()
      .from(sponsorships)
      .where(
        and(
          eq(sponsorships.creatorId, this.creatorId),
          inArray(sponsorships.status, ['lead', 'negotiating', 'contracted'])
        )
      );
  }

  private async getCreatorContext(): Promise<CreatorContext> {
    const db = getDb();
    const [goals, channel] = await Promise.all([
      db.query.creatorGoals.findMany({
        where: and(eq(creatorGoals.creatorId, this.creatorId), eq(creatorGoals.status, 'active')),
      }),
      db.query.youtubeChannels.findFirst({
        where: eq(youtubeChannels.creatorId, this.creatorId),
      }),
    ]);

    return { goals, subscriberCount: channel?.subscriberCount ?? 0 };
  }

  private async saveScores(scores: ImpactScore[]): Promise<void> {
    if (scores.length === 0) return;
    const db = getDb();
    const scoreDate = new Date().toISOString().slice(0, 10);

    await db.insert(impactScores).values(
      scores.map((score) => ({
        creatorId: this.creatorId,
        entityType: score.entityType,
        entityId: score.entityId,
        scoreDate,
        totalScore: score.totalScore,
        urgencyScore: score.breakdown.urgency,
        revenueScore: score.breakdown.revenue,
        audienceScore: score.breakdown.audience,
        goalAlignmentScore: score.breakdown.goalAlignment,
        effortScore: score.breakdown.effort,
        momentumScore: score.breakdown.momentum,
        reasoning: score.reasoning,
      }))
    );
  }

  /**
   * Get top recommendation
   */
  async getTopRecommendation(): Promise<ImpactScore | null> {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    const rows = await db.query.impactScores.findMany({
      where: and(eq(impactScores.creatorId, this.creatorId), eq(impactScores.scoreDate, today)),
    });

    if (rows.length === 0) return null;

    const top = rows.reduce((best, row) => ((row.totalScore ?? 0) > (best.totalScore ?? 0) ? row : best));

    const [title] = await this.resolveTitles([top]);

    return {
      entityType: top.entityType as ImpactScore['entityType'],
      entityId: top.entityId,
      title: title ?? 'Untitled',
      totalScore: top.totalScore ?? 0,
      breakdown: {
        urgency: top.urgencyScore ?? 0,
        revenue: top.revenueScore ?? 0,
        audience: top.audienceScore ?? 0,
        goalAlignment: top.goalAlignmentScore ?? 0,
        effort: top.effortScore ?? 0,
        momentum: top.momentumScore ?? 0,
      },
      reasoning: top.reasoning ?? '',
    };
  }

  private async resolveTitles(rows: (typeof impactScores.$inferSelect)[]): Promise<(string | null)[]> {
    const db = getDb();
    return Promise.all(
      rows.map(async (row) => {
        if (row.entityType === 'task') {
          const task = await db.query.tasks.findFirst({ where: eq(tasks.id, row.entityId) });
          return task?.title ?? null;
        }
        if (row.entityType === 'idea') {
          const idea = await db.query.contentIdeas.findFirst({ where: eq(contentIdeas.id, row.entityId) });
          return idea?.title ?? null;
        }
        if (row.entityType === 'sponsorship') {
          const sponsorship = await db.query.sponsorships.findFirst({
            where: eq(sponsorships.id, row.entityId),
          });
          return sponsorship?.brandName ?? null;
        }
        return null;
      })
    );
  }
}
