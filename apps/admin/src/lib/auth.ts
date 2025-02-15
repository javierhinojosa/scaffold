/// <reference types="astro/client" />
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Define types
export type AuthState = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

// Create and export the createClient function for SSR
export const createClient = (cookies: {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
}) => {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    // Use service role key for server-side operations
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false, // Don't persist session on client
        autoRefreshToken: false, // Handle token refresh manually on server
      },
      cookies: {
        get: (key: string) => cookies.get(key),
        set: (key: string, value: string, options: CookieOptions) =>
          cookies.set(key, value, options),
        remove: (key: string, options: CookieOptions) =>
          cookies.set(key, '', { ...options, maxAge: -1 }),
      },
    }
  );
};
