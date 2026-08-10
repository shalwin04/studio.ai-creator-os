/**
 * Job Queue
 *
 * BullMQ queues for background job processing.
 */

import { Queue } from 'bullmq';
import { getRedis } from './redis.js';

export let youtubeSyncQueue: Queue;
export let briefingQueue: Queue;
export let impactScoreQueue: Queue;
export let notificationQueue: Queue;

export async function initQueue() {
  const connection = getRedis();

  youtubeSyncQueue = new Queue('youtube-sync', { connection });
  briefingQueue = new Queue('briefing', { connection });
  impactScoreQueue = new Queue('impact-score', { connection });
  notificationQueue = new Queue('notification', { connection });

  // Schedule recurring jobs
  await scheduleRecurringJobs();

  console.log('Queues initialized');
}

async function scheduleRecurringJobs() {
  // YouTube sync - daily at 3 AM UTC
  await youtubeSyncQueue.upsertJobScheduler(
    'daily-youtube-sync',
    { pattern: '0 3 * * *' },
    { name: 'sync-all-creators', data: {} }
  );

  // Impact score calculation - daily at 5 AM UTC
  await impactScoreQueue.upsertJobScheduler(
    'daily-impact-calc',
    { pattern: '0 5 * * *' },
    { name: 'calculate-all', data: {} }
  );

  // Daily briefing - 6 AM UTC (will be adjusted per creator timezone)
  await briefingQueue.upsertJobScheduler(
    'daily-briefing',
    { pattern: '0 6 * * *' },
    { name: 'generate-all', data: {} }
  );
}

export async function closeQueues() {
  await Promise.all([
    youtubeSyncQueue?.close(),
    briefingQueue?.close(),
    impactScoreQueue?.close(),
    notificationQueue?.close(),
  ]);
}
