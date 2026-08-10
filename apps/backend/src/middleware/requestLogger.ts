/**
 * Request Logger Middleware
 *
 * Logs incoming requests with timing information.
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
  });
}
