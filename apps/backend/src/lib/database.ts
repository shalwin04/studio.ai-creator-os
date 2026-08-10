/**
 * Database Client
 *
 * Drizzle ORM connection to Supabase PostgreSQL.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema.js';
import { env } from './env.js';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

export async function initDatabase() {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  db = drizzle(pool, { schema });

  // Test connection
  await pool.query('SELECT 1');
  console.log('Database connected');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
  }
}
