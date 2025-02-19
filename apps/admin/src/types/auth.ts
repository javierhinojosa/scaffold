import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminUser } from '../lib/security/types';

export interface AuthLocals {
  user: AdminUser | null;
  supabase: SupabaseClient;
  csrfToken?: string;
  isLoggedIn: boolean;
  message?: string;
  email?: string | null;
  user_id?: string;
} 