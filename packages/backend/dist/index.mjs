// src/index.ts
import { createClient as createClient2 } from "@supabase/supabase-js";

// src/auth.ts
import { createClient } from "@supabase/supabase-js";
var Auth = class {
  supabaseClient;
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  // Expose client for testing purposes
  get client() {
    return this.supabaseClient;
  }
  async signInWithEmail(email, password) {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  }
  async signUp(email, password) {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  }
  async signOut() {
    const { error } = await this.supabaseClient.auth.signOut();
    if (error) throw error;
  }
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  }
  onAuthStateChange(callback) {
    return this.supabaseClient.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }
};
function createSvelteAuthStore(options) {
  const store = options.createStore({
    user: null,
    loading: true
  });
  async function init() {
    try {
      const { data: { session } } = await options.auth.client.auth.getSession();
      store.set({ user: session?.user ?? null, loading: false });
      options.auth.onAuthStateChange((user) => {
        store.set({ user, loading: false });
      });
    } catch (error) {
      if (error instanceof Error && error.name !== "AuthSessionMissingError") {
        console.error("Error initializing auth store:", error);
      }
      store.set({ user: null, loading: false });
    }
  }
  init();
  return store;
}

// src/index.ts
var supabaseClient = null;
var createSupabaseClient = (supabaseUrl, supabaseKey) => {
  if (!supabaseClient) {
    supabaseClient = createClient2(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }
  return supabaseClient;
};
var getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error("Supabase client not initialized. Call createSupabaseClient first.");
  }
  return supabaseClient;
};
function createSupabaseAuth(supabaseUrl, supabaseKey) {
  return new Auth(supabaseUrl, supabaseKey);
}
export {
  Auth,
  createSupabaseAuth,
  createSupabaseClient,
  createSvelteAuthStore,
  getSupabaseClient
};
