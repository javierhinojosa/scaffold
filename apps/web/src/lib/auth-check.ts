import { auth } from './auth';
import { authStore } from './stores/auth';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  loading: boolean;
  user: User | null;
}

const PROTECTED_ROUTES = ['/dashboard'];

export function initAuthCheck(currentPath: string) {
  let mounted = false;
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => currentPath.startsWith(route));
  const isLoginPage = currentPath === '/login';

  // Initialize auth session
  const initSession = async () => {
    try {
      const { data: { session } } = await auth.client.auth.getSession();
      
      if (!session && isProtectedRoute) {
        window.location.href = '/login';
        return;
      }

      // If logged in and on login page, redirect to dashboard
      if (session && isLoginPage) {
        window.location.href = '/dashboard';
        return;
      }
    } catch (error) {
      // Only log error if on protected route
      if (isProtectedRoute) {
        console.error('Error checking auth session:', error);
      }
    }
  };

  initSession();

  authStore.subscribe(({ loading, user }: AuthState) => {
    if (!mounted) {
      mounted = true;
      return;
    }

    if (!loading) {
      loadingEl?.classList.add('hidden');
      contentEl?.classList.remove('hidden');

      if (!user && isProtectedRoute) {
        window.location.href = '/login';
      } else if (user && isLoginPage) {
        window.location.href = '/dashboard';
      }
    }
  });
} 