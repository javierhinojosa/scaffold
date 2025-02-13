import { createSupabaseClient } from '@sfh/backend';

// Initialize the Supabase client
export const supabase = createSupabaseClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
