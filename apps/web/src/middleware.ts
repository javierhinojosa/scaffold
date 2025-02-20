import { defineMiddleware } from "astro:middleware";
import { getUser } from "./utils/supabaseServer";
import { accessTokenName, refreshTokenName } from "./utils/config";

export const onRequest = defineMiddleware(async ({ cookies, locals, url, redirect }, next) => {
  // Get tokens from cookies
  const accessToken = cookies.get(accessTokenName)?.value;
  const refreshToken = cookies.get(refreshTokenName)?.value;

  // Get user data if tokens exist
  const userData = await getUser({
    accessToken,
    refreshToken,
    cookies: {
      get: (name) => cookies.get(name)?.value,
      set: (name, value, options) => cookies.set(name, value, options),
      remove: (name, options) => cookies.delete(name, options),
    },
  });

  // Set auth state in locals
  locals.isLoggedIn = !!userData;
  locals.user = userData;

  // Handle protected routes
  const protectedRoutes = ['/dashboard'];
  const publicRoutes = ['/login', '/signup'];
  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

  if (isProtectedRoute && !locals.isLoggedIn) {
    return redirect('/login');
  }

  if (isPublicRoute && locals.isLoggedIn) {
    return redirect('/dashboard');
  }

  return next();
}); 