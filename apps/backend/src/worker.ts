/**
 * Background Worker Entry Point
 *
 * Runs BullMQ workers for background job processing.
 */

import { initRedis } from './lib/redis.js';
import { initDatabase } from './lib/database.js';
import { startWorkers } from './jobs/index.js';

async function bootstrap() {
  console.log('Starting background workers...');

  await initDatabase();
  await initRedis();
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
