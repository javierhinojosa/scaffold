import type { Auth } from './auth';

export interface AuthContext {
  url: URL;
  next: () => Promise<Response> | Response;
}

export interface AuthenticatedContext extends AuthContext {
  user: import('./auth').User;
  session: import('@supabase/supabase-js').Session;
}

export function createAuthMiddleware(auth: Auth) {
  return async (context: AuthContext): Promise<Response> => {
    try {
      const session = await auth.getSession();

      // If no session exists, redirect to login
      if (!session) {
        const loginUrl = new URL('/login', context.url);
        loginUrl.searchParams.set('redirect', context.url.pathname + context.url.search);
        return Response.redirect(loginUrl.toString(), 302);
      }

      // Validate session is not expired
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        await auth.signOut();
        const loginUrl = new URL('/login', context.url);
        loginUrl.searchParams.set('redirect', context.url.pathname + context.url.search);
        loginUrl.searchParams.set('error', 'session_expired');
        return Response.redirect(loginUrl.toString(), 302);
      }

      // Get current user to ensure it exists and is valid
      const user = await auth.getCurrentUser();
      if (!user) {
        await auth.signOut();
        const loginUrl = new URL('/login', context.url);
        loginUrl.searchParams.set('error', 'invalid_user');
        return Response.redirect(loginUrl.toString(), 302);
      }

      // Add authenticated user and session to context
      const authenticatedContext: AuthenticatedContext = {
        ...context,
        user,
        session,
      };

      return context.next();
    } catch (error) {
      console.error('Auth middleware error:', error);

      // Handle authentication errors gracefully
      const loginUrl = new URL('/login', context.url);
      loginUrl.searchParams.set('error', 'auth_error');
      return Response.redirect(loginUrl.toString(), 302);
    }
  };
}
