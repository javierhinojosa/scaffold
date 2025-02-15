import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminUser } from '../lib/security/types';

declare module 'astro' {
  interface Locals {
    user: AdminUser | null;
    supabase: SupabaseClient;
    csrfToken?: string;
  }

  interface APIContext {
    response: Response;
  }
}
