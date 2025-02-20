import { Auth, type AuthConfig } from '@scaffold/auth';

export const authConfig: AuthConfig = {
  supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL,
  supabaseKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  session: {
    persistSession: true,
    autoRefresh: true,
    storageType: 'cookie',
    cookieOptions: {
      sameSite: 'lax',
      secure: import.meta.env.PROD,
    }
  },
  middleware: {
    protectedRoutes: [
      '/admin',
      /^\/docs\/private\/.*/,
      (pathname) => pathname.startsWith('/internal')
    ],
    publicRoutes: ['/login', '/signup'],
    loginPage: '/login'
  },
  security: {
    enableCSRF: true,
    rateLimit: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000 // 15 minutes
    }
  }
};

export const auth = new Auth(authConfig); 