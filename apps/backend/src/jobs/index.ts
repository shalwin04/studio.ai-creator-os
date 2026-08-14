/**
 * Background Jobs
 *
 * BullMQ workers for background processing.
 */

import { Worker, Job } from 'bullmq';
import { and, eq, isNotNull } from 'drizzle-orm';
import { getRedis } from '../lib/redis.js';
import { getDb } from '../lib/database.js';
import { youtubeSyncQueue } from '../lib/queue.js';
import { creators } from '../db/schema.js';
import { YouTubeService } from '../services/youtube/index.js';
import { BriefingService } from '../services/briefing/index.js';
import { ImpactService } from '../services/impact/index.js';
import { NotificationService } from '../services/notification/index.js';

export async function startWorkers() {
  const connection = getRedis();

  // YouTube Sync Worker
  new Worker(
    'youtube-sync',
    async (job: Job) => {
      console.log('Processing youtube-sync job:', job.id);

      if (job.name === 'sync-all-creators') {
        await syncAllCreators();
      } else {
        const { creatorId, fullSync } = job.data;
        const service = new YouTubeService(creatorId);
        await service.sync(fullSync);
      }
    },
    { connection }
  );

  // Briefing Worker
  new Worker(
    'briefing',
    async (job: Job) => {
      console.log('Processing briefing job:', job.id);

      if (job.name === 'generate-all') {
        await generateAllBriefings();
      } else {
        const { creatorId } = job.data;
        const service = new BriefingService(creatorId);
        await service.generate();
      }
    },
    { connection }
  );

  // Impact Score Worker
  new Worker(
    'impact-score',
    async (job: Job) => {
      console.log('Processing impact-score job:', job.id);

      if (job.name === 'calculate-all') {
        await calculateAllImpactScores();
      } else {
        const { creatorId } = job.data;
        const service = new ImpactService(creatorId);
        await service.calculateDaily();
      }
    },
    { connection }
  );

  // Notification Worker
  new Worker(
    'notification',
    async (job: Job) => {
      console.log('Processing notification job:', job.id);

      const { creatorId, payload } = job.data;
      const service = new NotificationService(creatorId);
      await service.send(payload);
    },
    { connection }
  );

  console.log('All workers started');
}

// Helper functions

async function syncAllCreators() {
  const db = getDb();
  const connectedCreators = await db
    .select({ id: creators.id })
    .from(creators)
    .where(and(eq(creators.youtubeConnected, true), isNotNull(creators.youtubeRefreshToken)));

  console.log(`Queuing YouTube sync for ${connectedCreators.length} creator(s)...`);

  for (const creator of connectedCreators) {
    await youtubeSyncQueue.add('sync-creator', { creatorId: creator.id, fullSync: false });
  }
}

async function generateAllBriefings() {
  // TODO: Get all creators and queue individual briefing jobs
  console.log('Generating all briefings...');
}

async function calculateAllImpactScores() {
  // TODO: Get all creators and queue individual impact score jobs
  console.log('Calculating all impact scores...');
}
