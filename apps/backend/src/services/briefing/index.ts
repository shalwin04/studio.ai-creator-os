/**
 * Briefing Service
 *
 * Generates daily AI briefings for creators.
 */

import { and, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import { gemini } from '../../lib/llm.js';
import { getDb } from '../../lib/database.js';
import { dailyBriefings, youtubeChannels, youtubeVideos, videoAnalytics, tasks } from '../../db/schema.js';
import { ImpactService, type ImpactScore } from '../impact/index.js';

export interface Briefing {
  id: string;
  creatorId: string;
  briefingDate: Date;
  greeting: string;
  topPriorities: Priority[];
  keyMetrics: Metrics;
  opportunities: Opportunity[];
  warnings: Warning[];
  fullContent: string;
}

export interface Priority {
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  impactScore: number;
}

export interface Metrics {
  subscriberChange: number;
  viewsLast7Days: number;
  viewsChange: number;
  topVideo: string;
  engagementRate: number;
}

export interface Opportunity {
  title: string;
  description: string;
  potentialImpact: string;
}

export interface Warning {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface BriefingContext {
  topPriorities: Priority[];
  metrics: Metrics;
  opportunities: Opportunity[];
  warnings: Warning[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_METRICS: Metrics = {
  subscriberChange: 0,
  viewsLast7Days: 0,
  viewsChange: 0,
  topVideo: '',
  engagementRate: 0,
};

export class BriefingService {
  private creatorId: string;

  constructor(creatorId: string) {
    this.creatorId = creatorId;
  }

  /**
   * Generate daily briefing
   */
  async generate(): Promise<Briefing> {
    const context = await this.gatherContext();
    const briefing = await this.generateBriefingContent(context);
    await this.saveBriefing(briefing);
    return briefing;
  }

  /**
   * Gather context for briefing
   */
  private async gatherContext(): Promise<BriefingContext> {
    const [priorities, metrics, overdueTasks] = await Promise.all([
      new ImpactService(this.creatorId).calculateDaily(),
      this.getPerformanceInsights(),
      this.getOverdueTasks(),
    ]);

    const topPriorities: Priority[] = priorities.slice(0, 3).map((p) => ({
      title: p.title,
      description: p.reasoning,
      entityType: p.entityType,
      entityId: p.entityId,
      impactScore: p.totalScore,
    }));

    const opportunities = this.buildOpportunities(priorities);
    const warnings = this.buildWarnings(overdueTasks);

    return { topPriorities, metrics, opportunities, warnings };
  }

  /**
   * Performance insights: rolling 7-day metrics vs. the prior 7 days.
   * Standalone from the full briefing so the app can show a metrics widget
   * without generating (and persisting) a new daily briefing.
   */
  async getPerformanceInsights(): Promise<Metrics> {
    const db = getDb();
    const channel = await db.query.youtubeChannels.findFirst({
      where: eq(youtubeChannels.creatorId, this.creatorId),
    });
    if (!channel) return EMPTY_METRICS;

    const videos = await db.query.youtubeVideos.findMany({
      where: eq(youtubeVideos.channelId, channel.id),
    });
    const videoIds = videos.map((v) => v.id);
    if (videoIds.length === 0) return EMPTY_METRICS;

    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString().slice(0, 10);
    const fourteenDaysAgo = new Date(Date.now() - 14 * DAY_MS).toISOString().slice(0, 10);

    const [recent, previous] = await Promise.all([
      db
        .select()
        .from(videoAnalytics)
        .where(and(inArray(videoAnalytics.videoId, videoIds), gte(videoAnalytics.date, sevenDaysAgo))),
      db
        .select()
        .from(videoAnalytics)
        .where(
          and(
            inArray(videoAnalytics.videoId, videoIds),
            gte(videoAnalytics.date, fourteenDaysAgo),
            lt(videoAnalytics.date, sevenDaysAgo)
          )
        ),
    ]);

    const sum = (rows: typeof recent, key: 'views' | 'likes' | 'comments' | 'subscribersGained') =>
      rows.reduce((total, row) => total + (row[key] ?? 0), 0);

    const viewsLast7Days = sum(recent, 'views');
    const viewsPrev7Days = sum(previous, 'views');
    const viewsChange = viewsPrev7Days === 0 ? 0 : ((viewsLast7Days - viewsPrev7Days) / viewsPrev7Days) * 100;
    const subscriberChange = sum(recent, 'subscribersGained');
    const engagementRate =
      viewsLast7Days === 0 ? 0 : ((sum(recent, 'likes') + sum(recent, 'comments')) / viewsLast7Days) * 100;

    const viewsByVideo = new Map<string, number>();
    for (const row of recent) {
      viewsByVideo.set(row.videoId, (viewsByVideo.get(row.videoId) ?? 0) + (row.views ?? 0));
    }
    const topVideoId = [...viewsByVideo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const topVideo = videos.find((v) => v.id === topVideoId)?.title ?? '';

    return { subscriberChange, viewsLast7Days, viewsChange, topVideo, engagementRate };
  }

  private async getOverdueTasks() {
    const db = getDb();
    return db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.creatorId, this.creatorId),
          inArray(tasks.status, ['pending', 'in_progress']),
          lt(tasks.dueDate, new Date())
        )
      );
  }

  private buildOpportunities(priorities: ImpactScore[]): Opportunity[] {
    return priorities
      .filter((p) => p.entityType === 'idea')
      .slice(0, 3)
      .map((p) => ({
        title: p.title,
        description: p.reasoning,
        potentialImpact: `Impact score ${p.totalScore.toFixed(0)}/100`,
      }));
  }

  private buildWarnings(overdueTasks: Awaited<ReturnType<BriefingService['getOverdueTasks']>>): Warning[] {
    return overdueTasks.map((task) => ({
      title: `Overdue: ${task.title}`,
      description: task.dueDate ? `Was due ${new Date(task.dueDate).toLocaleDateString()}.` : 'Past due.',
      severity: 'high',
    }));
  }

  /**
   * Opportunity alerts: top AI-generated content ideas by impact score.
   */
  async getOpportunityAlerts(): Promise<Opportunity[]> {
    const priorities = await new ImpactService(this.creatorId).calculateDaily();
    return this.buildOpportunities(priorities);
  }

  /**
   * Risk alerts: currently overdue tasks.
   */
  async getRiskAlerts(): Promise<Warning[]> {
    const overdueTasks = await this.getOverdueTasks();
    return this.buildWarnings(overdueTasks);
  }

  /**
   * Generate briefing content with LLM
   */
  private async generateBriefingContent(context: BriefingContext): Promise<Briefing> {
    const prompt = `You are writing a short daily briefing for a YouTube creator. Respond with ONLY a JSON object
(no markdown fences) shaped like {"greeting": string, "summary": string}.

"greeting" is one warm, specific sentence to open the briefing.
"summary" is 2-4 sentences summarizing today's priorities, metrics, and any warnings in plain language.

Data:
Top priorities: ${JSON.stringify(context.topPriorities)}
Key metrics: ${JSON.stringify(context.metrics)}
Opportunities: ${JSON.stringify(context.opportunities)}
Warnings: ${JSON.stringify(context.warnings)}`;

    let greeting = "Here's your briefing for today.";
    let summary = '';

    try {
      const response = await gemini.invoke(prompt);
      const text = typeof response.content === 'string' ? response.content : String(response.content);
      const parsed = JSON.parse(text.trim().replace(/^```json\s*|\s*```$/g, ''));
      if (typeof parsed.greeting === 'string') greeting = parsed.greeting;
      if (typeof parsed.summary === 'string') summary = parsed.summary;
    } catch {
      // Fall back to the data-driven defaults above if the model output isn't parseable JSON.
    }

    const fullContent = [greeting, summary].filter(Boolean).join('\n\n');

    return {
      id: crypto.randomUUID(),
      creatorId: this.creatorId,
      briefingDate: new Date(),
      greeting,
      topPriorities: context.topPriorities,
      keyMetrics: context.metrics,
      opportunities: context.opportunities,
      warnings: context.warnings,
      fullContent,
    };
  }

  /**
   * Save briefing to database
   */
  private async saveBriefing(briefing: Briefing): Promise<void> {
    const db = getDb();
    await db.insert(dailyBriefings).values({
      creatorId: this.creatorId,
      briefingDate: briefing.briefingDate.toISOString().slice(0, 10),
      greeting: briefing.greeting,
      topPriorities: briefing.topPriorities,
      keyMetrics: briefing.keyMetrics,
      opportunities: briefing.opportunities,
      warnings: briefing.warnings,
      fullContent: briefing.fullContent,
    });
  }

  /**
   * Get latest briefing
   */
  async getLatest(): Promise<Briefing | null> {
    const db = getDb();
    const row = await db.query.dailyBriefings.findFirst({
      where: eq(dailyBriefings.creatorId, this.creatorId),
      orderBy: desc(dailyBriefings.briefingDate),
    });

    if (!row) return null;

    return {
      id: row.id,
      creatorId: row.creatorId,
      briefingDate: new Date(row.briefingDate),
      greeting: row.greeting ?? '',
      topPriorities: (row.topPriorities as Priority[]) ?? [],
      keyMetrics: (row.keyMetrics as Metrics) ?? EMPTY_METRICS,
      opportunities: (row.opportunities as Opportunity[]) ?? [],
      warnings: (row.warnings as Warning[]) ?? [],
      fullContent: row.fullContent ?? '',
    };
  }

  /**
   * Mark briefing as read
   */
  async markAsRead(briefingId: string): Promise<void> {
    const db = getDb();
    await db
      .update(dailyBriefings)
      .set({ isRead: true })
      .where(and(eq(dailyBriefings.id, briefingId), eq(dailyBriefings.creatorId, this.creatorId)));
  }
}
