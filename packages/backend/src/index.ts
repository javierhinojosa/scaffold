import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Auth } from './auth';

export type { Database };

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: process.env.NODE_ENV !== 'test',
        autoRefreshToken: process.env.NODE_ENV !== 'test',
        debug: true,
      },
    });
  }
  return supabaseClient;
};

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient first.');
  }
  return supabaseClient;
};

export function createSupabaseAuth(supabaseUrl: string, supabaseKey: string) {
  return new Auth(supabaseUrl, supabaseKey);
}

// Re-export types from supabase-js for convenience
export type {
  User,
  Session,
  AuthError,
  AuthResponse,
  AuthTokenResponse,
} from '@supabase/supabase-js';

export * from './auth';
