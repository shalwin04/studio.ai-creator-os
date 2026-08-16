/**
 * Memory Service
 *
 * Three-tier memory system: Episodic, Semantic, Procedural.
 */

import { and, desc, eq, sql } from 'drizzle-orm';
import { generateEmbedding } from '../../../lib/llm.js';
import { getDb } from '../../../lib/database.js';
import {
  creators,
  creatorMemory,
  creatorGoals,
  conversations,
  messages,
  youtubeChannels,
  youtubeVideos,
} from '../../../db/schema.js';

export interface Memory {
  id: string;
  content: string;
  type: 'episodic' | 'semantic' | 'procedural';
  metadata: Record<string, any>;
  importance: number;
  createdAt: Date;
}

export interface RetrievalOptions {
  types?: ('episodic' | 'semantic' | 'procedural')[];
  limit?: number;
  minImportance?: number;
}

export interface AgentContext {
  conversationHistory: any[];
  relevantMemories: Memory[];
  creatorState: any;
  youtubeContext: any;
}

// text-embedding-004 output size — must match the `embedding vector(768)` column (drizzle/0005_pgvector_agent_memory.sql).
const EMBEDDING_DIMENSIONS = 768;

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export class MemoryService {
  private creatorId: string;

  constructor(creatorId: string) {
    this.creatorId = creatorId;
  }

  /**
   * Retrieve relevant context for agent
   */
  async retrieveContext(
    message: string,
    options: RetrievalOptions = {}
  ): Promise<AgentContext> {
    const [conversationHistory, relevantMemories, creatorState, youtubeContext] =
      await Promise.all([
        this.getConversationHistory(),
        this.searchMemories(message, options.limit || 5),
        this.getCreatorState(),
        this.getYouTubeContext(),
      ]);

    return {
      conversationHistory,
      relevantMemories,
      creatorState,
      youtubeContext,
    };
  }

  /**
   * Save new memory
   */
  async saveMemory(
    content: string,
    type: 'episodic' | 'semantic' | 'procedural',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const db = getDb();
    const embedding = await generateEmbedding(content);
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Expected embedding of length ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
      );
    }

    await db.execute(sql`
      INSERT INTO agent_memory (creator_id, content, memory_type, metadata, embedding)
      VALUES (
        ${this.creatorId},
        ${content},
        ${type},
        ${JSON.stringify(metadata)}::jsonb,
        ${toVectorLiteral(embedding)}::vector
      )
    `);
  }

  /**
   * Search memories using vector similarity
   */
  async searchMemories(query: string, limit: number = 5): Promise<Memory[]> {
    const db = getDb();
    const queryEmbedding = await generateEmbedding(query);

    const result = await db.execute<{
      id: string;
      content: string;
      memory_type: Memory['type'];
      metadata: Record<string, any> | null;
      importance: number;
      created_at: Date;
    }>(sql`
      SELECT id, content, memory_type, metadata, importance, created_at
      FROM agent_memory
      WHERE creator_id = ${this.creatorId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${toVectorLiteral(queryEmbedding)}::vector
      LIMIT ${limit}
    `);

    await this.touchAccessed(result.rows.map((row) => row.id));

    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      type: row.memory_type,
      metadata: row.metadata ?? {},
      importance: row.importance,
      createdAt: row.created_at,
    }));
  }

  private async touchAccessed(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = getDb();
    await db.execute(sql`
      UPDATE agent_memory
      SET access_count = access_count + 1, last_accessed = now()
      WHERE id = ANY(${ids})
    `);
  }

  /**
   * Update creator preferences
   */
  async updateCreatorMemory(
    key: string,
    value: string,
    confidence: number = 0.8
  ): Promise<void> {
    const db = getDb();
    const existing = await db.query.creatorMemory.findFirst({
      where: and(eq(creatorMemory.creatorId, this.creatorId), eq(creatorMemory.key, key)),
    });

    if (existing) {
      await db
        .update(creatorMemory)
        .set({ value, confidence, lastConfirmed: new Date(), updatedAt: new Date() })
        .where(eq(creatorMemory.id, existing.id));
    } else {
      await db.insert(creatorMemory).values({
        creatorId: this.creatorId,
        key,
        value,
        confidence,
        lastConfirmed: new Date(),
      });
    }
  }

  /**
   * Get recent conversation history
   */
  private async getConversationHistory(limit: number = 10): Promise<any[]> {
    const db = getDb();
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.creatorId, this.creatorId),
      orderBy: desc(conversations.updatedAt),
    });

    if (!conversation) return [];

    const recent = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversation.id),
      orderBy: desc(messages.createdAt),
      limit,
    });

    return recent.reverse();
  }

  /**
   * Get creator state (profile, goals, preferences)
   */
  private async getCreatorState(): Promise<any> {
    const db = getDb();
    const [profile, preferences, goals] = await Promise.all([
      db.query.creators.findFirst({ where: eq(creators.id, this.creatorId) }),
      db.query.creatorMemory.findMany({ where: eq(creatorMemory.creatorId, this.creatorId) }),
      db.query.creatorGoals.findMany({
        where: and(eq(creatorGoals.creatorId, this.creatorId), eq(creatorGoals.status, 'active')),
      }),
    ]);

    return { profile, preferences, goals };
  }

  /**
   * Get recent YouTube context
   */
  private async getYouTubeContext(): Promise<any> {
    const db = getDb();
    const channel = await db.query.youtubeChannels.findFirst({
      where: eq(youtubeChannels.creatorId, this.creatorId),
    });

    if (!channel) return {};

    const recentVideos = await db.query.youtubeVideos.findMany({
      where: eq(youtubeVideos.channelId, channel.id),
      orderBy: desc(youtubeVideos.publishedAt),
      limit: 5,
    });

    return { channel, recentVideos };
  }

  /**
   * Consolidate and clean up old memories
   *
   * Decays importance for memories that haven't been accessed recently, and
   * drops ones that have decayed past relevance.
   */
  async consolidateMemories(): Promise<void> {
    const db = getDb();

    await db.execute(sql`
      UPDATE agent_memory
      SET importance = importance * 0.9
      WHERE creator_id = ${this.creatorId}
        AND (last_accessed IS NULL OR last_accessed < now() - interval '30 days')
    `);

    await db.execute(sql`
      DELETE FROM agent_memory
      WHERE creator_id = ${this.creatorId}
        AND importance < 0.1
    `);
  }
}
