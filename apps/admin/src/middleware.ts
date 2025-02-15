import { defineMiddleware } from 'astro/middleware';
import { createClient } from './lib/auth';
import { AdminAuthService } from './lib/security/admin-auth';
import { defaultSecurityConfig } from './lib/security/types';
import {
  handleCsrf,
  checkRateLimit,
  setSecurityHeaders,
  hashIp,
  setCsrfToken,
  verifyJWT,
} from './lib/security/utils';
import type { AuthError } from './lib/security/types';
import type { APIContext } from 'astro';
import '../types/astro';

// Extend Astro's Locals type
declare module 'astro' {
  interface Locals {
    user: AdminUser | null;
    supabase: SupabaseClient;
    csrfToken?: string;
  }
}

export const onRequest = defineMiddleware(async (context: APIContext, next) => {
  const config = defaultSecurityConfig;

  // Set security headers
  setSecurityHeaders(context.response.headers, config);

  // Create Supabase client with context cookies
  const supabase = createClient({
    get: (name) => context.cookies.get(name)?.value,
    set: (name, value, options) => context.cookies.set(name, value, options),
  });
  context.locals.supabase = supabase;

  const adminAuth = new AdminAuthService(supabase);

  // Handle public routes
  if (context.url.pathname === '/login') {
    // Rate limit login attempts
    const hashedIp = hashIp(context.clientAddress);
    checkRateLimit(config, hashedIp);

    // Set CSRF token for the login form
    const csrfToken = setCsrfToken(config, context.cookies);
    context.locals.csrfToken = csrfToken;
    return next();
  }

  if (context.url.pathname === '/register' || context.url.pathname === '/forgot-password') {
    return next();
  }

  try {
    // Validate CSRF token for non-GET requests
    handleCsrf(
      config,
      context.cookies,
      context.request.method,
      context.url.pathname,
      context.request.headers
    );

    // Get JWT from cookie
    const jwt = context.cookies.get('sb-access-token')?.value;
    if (!jwt) {
      return context.redirect('/login?redirect=' + encodeURIComponent(context.url.pathname));
    }

    // Verify JWT and get user claims
    const { sub: userId, exp: expiresAt } = await verifyJWT(jwt);
    if (!userId || !expiresAt || Date.now() >= expiresAt * 1000) {
      // Clear invalid token
      context.cookies.delete('sb-access-token');
      return context.redirect('/login?error=session_expired');
    }

    // Get and validate admin user
    const adminUser = await adminAuth.getAdminUser(userId);
    context.locals.user = adminUser;

    // Set new CSRF token for the next request
    const newCsrfToken = setCsrfToken(config, context.cookies);
    context.locals.csrfToken = newCsrfToken;

    const response = await next();

    // Add security headers to the response
    setSecurityHeaders(response.headers, config);

    return response;
  } catch (error) {
    console.error('Auth middleware error:', error);

    if ((error as AuthError).code === 'INVALID_CSRF') {
      return new Response('Invalid CSRF token', { status: 403 });
    }

    if ((error as AuthError).code === 'RATE_LIMITED') {
      return new Response('Too many attempts, please try again later', { status: 429 });
    }

    if ((error as AuthError).code === 'INSUFFICIENT_PERMISSIONS') {
      return new Response('Unauthorized', { status: 403 });
    }

    if ((error as AuthError).code === 'SESSION_EXPIRED') {
      const userId = context.locals.user?.id;
      if (userId) {
        await adminAuth.signOut(userId);
      }
      return context.redirect('/login?error=session_expired');
    }

    return context.redirect('/login?error=auth_error');
  }
});
