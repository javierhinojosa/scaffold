import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './types';

export type { User };

export type AuthStore = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

export class Auth {
  private supabaseClient: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: process.env.NODE_ENV !== 'test',
        autoRefreshToken: process.env.NODE_ENV !== 'test',
        debug: true,
      },
    });
  }

  // Expose client for testing purposes
  get client() {
    return this.supabaseClient;
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { user: data.user, session: data.session };
  }

  async signInWithOAuth(provider: 'github' | 'google') {
    const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
      provider,
    });
    if (error) throw error;
    return data;
  }

  async resetPassword(email: string) {
    const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabaseClient.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async getSession() {
    const { data, error } = await this.supabaseClient.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return { user: data.user, session: data.session };
  }

  async signOut() {
    const { error } = await this.supabaseClient.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabaseClient.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }
}

// Create a store factory function for frameworks that support reactive stores
export type CreateAuthStore<T> = (options: {
  auth: Auth;
  createStore: (value: AuthStore) => T;
}) => T;

// Example implementation for Svelte
export function createSvelteAuthStore(options: {
  auth: Auth;
  createStore: (value: AuthStore) => any;
}) {
  const store = options.createStore({
    user: null,
    loading: true,
    error: null,
  });

  async function init() {
    try {
      const {
        data: { session },
      } = await options.auth.client.auth.getSession();
      store.set({ user: session?.user ?? null, loading: false, error: null });

      options.auth.onAuthStateChange((user) => {
        store.set({ user, loading: false, error: null });
      });
    } catch (error) {
      // Suppress AuthSessionMissingError as it's expected when not logged in
      if (error instanceof Error && error.name !== 'AuthSessionMissingError') {
        console.error('Error initializing auth store:', error);
      }
      store.set({
        user: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  init();

  return store;
}

export function createAstroAuthStore(auth: Auth) {
  let store: AuthStore = {
    user: null,
    loading: true,
    error: null,
  };

  async function initialize() {
    try {
      const session = await auth.getSession();
      store = {
        user: session?.user ?? null,
        loading: false,
        error: null,
      };
    } catch (error) {
      store = {
        user: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  return {
    getStore: () => store,
    initialize,
  };
}
