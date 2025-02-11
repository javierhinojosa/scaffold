import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './types';

export type { User };

export type AuthStore = {
  user: User | null;
  loading: boolean;
};

export class Auth {
  private client: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { user: data.user, session: data.session };
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return { user: data.user, session: data.session };
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error) throw error;
    return user;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.client.auth.onAuthStateChange((_event, session) => {
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
  });

  async function init() {
    try {
      const user = await options.auth.getCurrentUser();
      store.set({ user, loading: false });

      options.auth.onAuthStateChange((user) => {
        store.set({ user, loading: false });
      });
    } catch (error) {
      console.error('Error initializing auth store:', error);
      store.set({ user: null, loading: false });
    }
  }

  init();

  return store;
} 