/**
 * Background Worker Entry Point
 *
 * Runs BullMQ workers for background job processing.
 */

import { initRedis } from './lib/redis.js';
import { initDatabase } from './lib/database.js';
import { initQueue } from './lib/queue.js';
import { startWorkers } from './jobs/index.js';

async function bootstrap() {
  console.log('Starting background workers...');

  await initDatabase();
  await initRedis();
  // Needed here too (not just server.ts) — the recurring "sync-all-creators"
  // job fans out to per-creator jobs via youtubeSyncQueue.add(), which runs
  // inside this worker process.
  await initQueue();
  await startWorkers();

  console.log('Workers started successfully');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down workers...');
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start workers:', err);
  process.exit(1);
});
