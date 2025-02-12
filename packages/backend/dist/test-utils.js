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

// src/test-utils.ts
var test_utils_exports = {};
__export(test_utils_exports, {
  createMockSession: () => createMockSession,
  createMockUser: () => createMockUser,
  createTestClient: () => createTestClient
});
module.exports = __toCommonJS(test_utils_exports);
var import_supabase_js = require("@supabase/supabase-js");
function createTestClient(supabaseUrl, supabaseKey) {
  return (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
function createMockUser(overrides = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    role: "authenticated",
    ...overrides
  };
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createMockSession,
  createMockUser,
  createTestClient
});
