/**
 * Backend Server Entry Point
 *
 * Fastify server with API routes, WebSocket support, and middleware.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';

import { authRoutes } from './api/auth/index.js';
import { chatRoutes } from './api/chat/index.js';
import { taskRoutes } from './api/tasks/index.js';
import { contentRoutes } from './api/content/index.js';
import { youtubeRoutes } from './api/youtube/index.js';
import { webhookRoutes } from './api/webhooks/index.js';
import { memoryRoutes } from './api/memory/index.js';
import { recommendationRoutes } from './api/recommendations/index.js';
import { briefingRoutes } from './api/briefing/index.js';
import { insightsRoutes } from './api/insights/index.js';
import { workflowRoutes } from './api/workflows/index.js';

import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

import { initDatabase } from './lib/database.js';
import { initRedis } from './lib/redis.js';
import { initQueue } from './lib/queue.js';
import { env } from './lib/env.js';

async function bootstrap() {
  const server = Fastify({
    logger: true,
  });

  // Register plugins
  await server.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });

  await server.register(helmet);

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await server.register(websocket);

  // Global hooks
  server.addHook('onRequest', requestLogger);
  server.addHook('onRequest', authMiddleware);
  server.setErrorHandler(errorHandler);

  // Health check
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // API routes
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(chatRoutes, { prefix: '/api/chat' });
  await server.register(taskRoutes, { prefix: '/api/tasks' });
  await server.register(contentRoutes, { prefix: '/api/content' });
  await server.register(youtubeRoutes, { prefix: '/api/youtube' });
  await server.register(webhookRoutes, { prefix: '/api/webhooks' });
  await server.register(memoryRoutes, { prefix: '/api/memory' });
  await server.register(recommendationRoutes, { prefix: '/api/recommendations' });
  await server.register(briefingRoutes, { prefix: '/api/briefing' });
  await server.register(insightsRoutes, { prefix: '/api/insights' });
  await server.register(workflowRoutes, { prefix: '/api/workflows' });

  // Initialize infrastructure
  await initDatabase();
  await initRedis();
  await initQueue();

  // Start server
  const address = await server.listen({
    port: env.PORT,
    host: '0.0.0.0',
  });

  console.log(`Server listening at ${address}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
