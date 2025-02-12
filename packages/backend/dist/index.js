"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Auth: () => Auth,
  createSupabaseAuth: () => createSupabaseAuth,
  createSupabaseClient: () => createSupabaseClient,
  createSvelteAuthStore: () => createSvelteAuthStore,
  getSupabaseClient: () => getSupabaseClient
});
module.exports = __toCommonJS(index_exports);
var import_supabase_js2 = require("@supabase/supabase-js");

// src/auth.ts
var import_supabase_js = require("@supabase/supabase-js");
var Auth = class {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseClient = (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey);
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
      var _a;
      callback((_a = session == null ? void 0 : session.user) != null ? _a : null);
    });
  }
};
function createSvelteAuthStore(options) {
  const store = options.createStore({
    user: null,
    loading: true
  });
  async function init() {
    var _a;
    try {
      const { data: { session } } = await options.auth.client.auth.getSession();
      store.set({ user: (_a = session == null ? void 0 : session.user) != null ? _a : null, loading: false });
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
    supabaseClient = (0, import_supabase_js2.createClient)(supabaseUrl, supabaseKey, {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Auth,
  createSupabaseAuth,
  createSupabaseClient,
  createSvelteAuthStore,
  getSupabaseClient
});
