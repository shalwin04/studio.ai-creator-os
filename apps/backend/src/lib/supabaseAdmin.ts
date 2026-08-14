/**
 * Supabase Admin Client
 *
 * Server-side client (service role) used to verify user access tokens
 * issued by Supabase Auth and to perform admin auth operations.
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

export async function verifySupabaseToken(token: string): Promise<AuthUser | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user?.email) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email,
    displayName: (data.user.user_metadata?.display_name as string | undefined) ?? null,
  };
}
