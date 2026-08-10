/**
 * Environment Configuration
 *
 * Validates and exports environment variables.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().transform((s) => s.split(',')).default('*'),

  // Database (Supabase PostgreSQL or local Docker)
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),

  // Auth
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Supabase (for auth verification)
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_KEY: z.string(),

  // LLM - Google Gemini
  GOOGLE_API_KEY: z.string(),

  // YouTube
  YOUTUBE_CLIENT_ID: z.string(),
  YOUTUBE_CLIENT_SECRET: z.string(),

  // Push Notifications
  EXPO_ACCESS_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
