import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from './types';

export function createTestClient(
  supabaseUrl: string,
  supabaseKey: string
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
    ...overrides,
  };
}

export function createMockSession(user = createMockUser()) {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    user,
  };
}
