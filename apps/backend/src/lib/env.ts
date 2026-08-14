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

  // Where the app's web build lives — used as the redirect target for
  // Supabase auth emails (confirmation, password reset). Without this,
  // Supabase falls back to its project default, which can land the user
  // on this bare API server instead of the app.
  APP_WEB_URL: z.string().default('http://localhost:8081'),

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
  YOUTUBE_REDIRECT_URI: z.string(),

  // Push Notifications
  EXPO_ACCESS_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
