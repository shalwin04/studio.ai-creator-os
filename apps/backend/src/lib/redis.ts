/**
 * Redis Client
 *
 * Shared Redis connection for caching and queues.
 */

import Redis from 'ioredis';
import { env } from './env.js';

let redis: Redis;

export async function initRedis() {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err);
  });

  redis.on('connect', () => {
    console.log('Redis connected');
  });

  // Test connection
  await redis.ping();
}

export function getRedis() {
  if (!redis) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redis;
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
  }
}
