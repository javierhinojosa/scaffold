import {
  __spreadValues
} from "./chunk-I2QYWX46.mjs";

// src/test-utils.ts
import { createClient } from "@supabase/supabase-js";
function createTestClient(supabaseUrl, supabaseKey) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
function createMockUser(overrides = {}) {
  return __spreadValues({
    id: "test-user-id",
    email: "test@example.com",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    role: "authenticated"
  }, overrides);
}
function createMockSession(user = createMockUser()) {
  return {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    expires_at: Date.now() + 36e5,
    user
  };
}
export {
  createMockSession,
  createMockUser,
  createTestClient
};
