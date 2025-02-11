import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type { Database };

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
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

// Re-export types from supabase-js for convenience
export type {
  User,
  Session,
  AuthError,
  AuthResponse,
  AuthTokenResponse,
} from '@supabase/supabase-js'; 