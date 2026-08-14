/**
 * Creator Service
 *
 * Maps Supabase auth users to creator records, creating one on first sign-in.
 */

import { eq } from 'drizzle-orm';
import { getDb } from '../lib/database.js';
import { creators } from '../db/schema.js';

export async function findOrCreateCreator(userId: string, email: string, displayName?: string | null) {
  const db = getDb();

  const existing = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  });

  if (existing) {
    // Backfills rows created before display names were captured.
    if (!existing.displayName && displayName) {
      const [updated] = await db
        .update(creators)
        .set({ displayName, updatedAt: new Date() })
        .where(eq(creators.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }

  const [created] = await db.insert(creators).values({ userId, email, displayName }).returning();
  if (!created) {
    throw new Error('Failed to create creator record');
  }
  return created;
}

export async function getCreatorById(creatorId: string) {
  const db = getDb();
  return db.query.creators.findFirst({
    where: eq(creators.id, creatorId),
  });
}
