/**
 * Auth Routes
 *
 * Authentication and user management endpoints, backed by Supabase Auth.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { env } from '../../lib/env.js';
import { findOrCreateCreator, getCreatorById } from '../../services/creator.js';
import { YouTubeService, resolveOAuthState } from '../../services/youtube/index.js';

// Deep link the app listens on to resume after the browser-based OAuth round trip
// (native only — matches the scheme already registered in apps/mobile/app.json).
// Web callers pass their own `redirectTo` instead, since a custom scheme can't
// be opened by a desktop/browser tab.
const APP_DEEP_LINK = 'agentic-creator-os://youtube-callback';

const youtubeCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

const youtubeConnectSchema = z.object({
  redirectTo: z.string().url().optional(),
});

function appendQueryParam(url: string, key: string, value: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${key}=${encodeURIComponent(value)}`;
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(200).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/register
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const { data, error } = await supabaseAdmin.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: { display_name: body.displayName },
        emailRedirectTo: `${env.APP_WEB_URL}/login`,
      },
    });

    if (error || !data.user?.email) {
      return reply.status(400).send({
        error: 'RegistrationFailed',
        message: error?.message ?? 'Could not create account',
      });
    }

    const creator = await findOrCreateCreator(data.user.id, data.user.email, body.displayName ?? null);

    return { user: { id: data.user.id, email: data.user.email }, session: data.session, creator };
  });

  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error || !data.session || !data.user.email) {
      return reply.status(401).send({
        error: 'InvalidCredentials',
        message: error?.message ?? 'Invalid email or password',
      });
    }

    const creator = await findOrCreateCreator(
      data.user.id,
      data.user.email,
      (data.user.user_metadata?.display_name as string | undefined) ?? null
    );

    return { session: data.session, user: { id: data.user.id, email: data.user.email }, creator };
  });

  // POST /api/auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body);

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: body.refreshToken,
    });

    if (error || !data.session) {
      return reply.status(401).send({
        error: 'InvalidRefreshToken',
        message: error?.message ?? 'Could not refresh session',
      });
    }

    return { session: data.session };
  });

  // POST /api/auth/logout
  fastify.post('/logout', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (token) {
      await supabaseAdmin.auth.admin.signOut(token).catch(() => {});
    }

    return { success: true };
  });

  // GET /api/auth/me
  fastify.get('/me', async (request, reply) => {
    const creator = await getCreatorById(request.user!.creatorId);

    if (!creator) {
      return reply.status(404).send({
        error: 'NotFound',
        message: 'Creator profile not found',
      });
    }

    return { creator };
  });

  // POST /api/auth/youtube/connect
  fastify.post('/youtube/connect', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const body = youtubeConnectSchema.parse(request.body ?? {});

    if (body.redirectTo) {
      const origin = new URL(body.redirectTo).origin;
      if (!env.CORS_ORIGINS.includes(origin)) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: 'redirectTo origin is not allowed',
        });
      }
    }

    const service = new YouTubeService(creatorId);
    const url = await service.getAuthUrl(env.YOUTUBE_REDIRECT_URI, body.redirectTo);

    return { url };
  });

  // GET /api/auth/youtube/callback
  // Public route: this is a plain browser redirect from Google, not an
  // authenticated API call, so the creator is recovered from the `state`
  // token instead of a Bearer header.
  fastify.get('/youtube/callback', async (request, reply) => {
    const query = youtubeCallbackQuerySchema.parse(request.query);

    if (query.error || !query.code || !query.state) {
      return reply.redirect(
        appendQueryParam(
          appendQueryParam(APP_DEEP_LINK, 'success', 'false'),
          'error',
          query.error ?? 'missing_code'
        )
      );
    }

    const stateData = await resolveOAuthState(query.state);
    if (!stateData) {
      return reply.redirect(appendQueryParam(appendQueryParam(APP_DEEP_LINK, 'success', 'false'), 'error', 'invalid_state'));
    }

    const target = stateData.redirectTo ?? APP_DEEP_LINK;

    try {
      const service = new YouTubeService(stateData.creatorId);
      await service.exchangeCode(query.code, env.YOUTUBE_REDIRECT_URI);
      await service.sync(true);

      return reply.redirect(appendQueryParam(target, 'success', 'true'));
    } catch (error) {
      request.log.error(error, 'YouTube OAuth callback failed');
      return reply.redirect(appendQueryParam(appendQueryParam(target, 'success', 'false'), 'error', 'connection_failed'));
    }
  });
};
