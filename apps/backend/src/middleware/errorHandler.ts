/**
 * Error Handler Middleware
 *
 * Global error handling for all routes.
 */

import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { env } from '../lib/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  error: FastifyError | AppError | ZodError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error
  request.log.error(error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors,
    });
  }

  // Known application errors
  if ('statusCode' in error && error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.code || 'Error',
      message: error.message,
    });
  }

  // Fastify errors (validation, etc.)
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      error: error.code || 'Error',
      message: error.message,
    });
  }

  // Unknown errors - don't leak details in production
  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message;

  return reply.status(500).send({
    error: 'Internal Server Error',
    message,
  });
}

// Custom error classes
export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message = 'Forbidden') {
    super(message);
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  code = 'BAD_REQUEST';

  constructor(message = 'Bad request') {
    super(message);
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message = 'Conflict') {
    super(message);
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMITED';

  constructor(message = 'Too many requests') {
    super(message);
  }
}
