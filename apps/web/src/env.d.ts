/// <reference types="astro/client" />

interface Locals {
  isLoggedIn?: boolean;
  user?: import('@supabase/supabase-js').User | null;
  message?: string;
  email?: string | null;
  user_id?: string;
} 