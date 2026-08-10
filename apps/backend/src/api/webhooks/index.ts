/**
 * Webhook Routes
 *
 * External webhook handlers.
 */

import { FastifyPluginAsync } from 'fastify';

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/webhooks/youtube
  fastify.post('/youtube', async (request, reply) => {
    // TODO: Handle YouTube push notifications
    return { received: true };
  });

  // POST /api/webhooks/stripe
  fastify.post('/stripe', async (request, reply) => {
    // TODO: Handle Stripe webhooks (if adding payments)
    return { received: true };
  });

  // POST /api/webhooks/supabase
  fastify.post('/supabase', async (request, reply) => {
    // TODO: Handle Supabase database webhooks
    return { received: true };
  });
};
