import { auth } from './auth';
import { authStore } from './stores/auth';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  loading: boolean;
  user: User | null;
}

const PROTECTED_ROUTES = ['/dashboard'];

export function initAuthCheck(currentPath: string) {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => currentPath.startsWith(route));
  const isLoginPage = currentPath === '/login';

  const initSession = async () => {
    try {
      const {
        data: { session },
      } = await auth.client.auth.getSession();

      authStore.update(state => ({
        ...state,
        loading: false,
        user: session?.user || null
      }));

      if (!session && isProtectedRoute) {
        window.location.href = '/login';
        return;
      }

      if (session && isLoginPage) {
        window.location.href = '/dashboard';
        return;
      }
    } catch (error) {
      if (isProtectedRoute) {
        console.error('Error checking auth session:', error);
      }
      authStore.update(state => ({
        ...state,
        loading: false,
        user: null
      }));
    }
  };

  authStore.update(state => ({ ...state, loading: true }));
  initSession();

  // Subscribe to auth store changes
  authStore.subscribe(({ loading, user }: AuthState) => {
    if (loading) {
      loadingEl?.classList.remove('hidden');
      contentEl?.classList.add('hidden');
    } else {
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