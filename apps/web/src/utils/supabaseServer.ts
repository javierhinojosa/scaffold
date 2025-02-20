import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey } from "./config";

// Create a server-side Supabase client that handles cookies properly
export function createServerSupabase(cookies: {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string, options: CookieOptions) => void;
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (key) => cookies.get(key),
      set: (key, value, options) => cookies.set(key, value, options),
      remove: (key, options) => cookies.remove(key, options),
    },
  });
}

export const getUser = async (arg: {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  cookies: {
    get: (name: string) => string | undefined;
    set: (name: string, value: string, options: CookieOptions) => void;
    remove: (name: string, options: CookieOptions) => void;
  };
}) => {
  const { accessToken, refreshToken, cookies } = arg;

  try {
    const supabase = createServerSupabase(cookies);
    
    if (accessToken && refreshToken) {
      // Set the session if tokens are provided
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError || "No user";

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, website, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.log('pgsql error:', profileError);
      throw profileError;
    }

    const { id, email, phone } = user;
    return {
      ...profile,
      id,
      email,
      phone,
    };
  } catch (e) {
    console.log('getUser error:', e);
    return undefined;
  }
};
