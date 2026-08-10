/**
 * Auth Middleware
 *
 * Verifies JWT tokens and attaches user to request.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { getDb } from '../lib/database.js';

// Routes that don't require auth
const PUBLIC_ROUTES = [
  '/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/webhooks',
];

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      creatorId: string;
      email: string;
    };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Skip auth for public routes
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    request.url.startsWith(route)
  );

  if (isPublicRoute) {
    return;
  }

  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
    };

    // Get creator from database
    const db = getDb();
    // TODO: Query creator by userId
    // const creator = await db.query.creators.findFirst({...});

    request.user = {
      userId: payload.sub,
      creatorId: payload.sub, // TODO: Replace with actual creatorId
      email: payload.email,
    };
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}
