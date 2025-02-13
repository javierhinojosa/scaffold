/// <reference types="astro/client" />
import { createSupabaseAuth, type User } from '@sfh/backend';

// Define types
export type AuthState = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

// Create and export the auth instance
export const auth = createSupabaseAuth(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
