/**
 * Auth Middleware
 *
 * Verifies Supabase-issued access tokens and attaches the creator to the request.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifySupabaseToken } from '../lib/supabaseAdmin.js';
import { findOrCreateCreator } from '../services/creator.js';

// Routes that don't require auth
const PUBLIC_ROUTES = [
  '/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/youtube/callback',
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

  const authUser = await verifySupabaseToken(token);

  if (!authUser) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }

  const creator = await findOrCreateCreator(authUser.id, authUser.email, authUser.displayName);

  request.user = {
    userId: authUser.id,
    creatorId: creator.id,
    email: authUser.email,
  };
}
