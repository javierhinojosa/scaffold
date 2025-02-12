// ../backend/dist/test-utils.mjs
import { createClient } from "@supabase/supabase-js";
function createTestClient(supabaseUrl2, supabaseKey) {
  return createClient(supabaseUrl2, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// src/auth.ts
var supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
var testClient = createTestClient(supabaseUrl, supabaseServiceKey);
var TEST_USER = {
  email: "javiereh@pm.me",
  password: "Stewart123!"
};
async function setupTestUser() {
  const { data: existingUser } = await testClient.auth.admin.listUsers();
  const userToDelete = existingUser?.users.find((u) => u.email === TEST_USER.email);
  if (userToDelete) {
    await testClient.auth.admin.deleteUser(userToDelete.id);
  }
  const { data, error } = await testClient.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true
    // Auto-confirm the email
  });
  if (error) throw error;
  return data.user;
}
async function cleanupTestUser() {
  const { data: { users } } = await testClient.auth.admin.listUsers();
  const testUser = users.find((u) => u.email === TEST_USER.email);
  if (testUser) {
    await testClient.auth.admin.deleteUser(testUser.id);
  }
}

export {
  testClient,
  TEST_USER,
  setupTestUser,
  cleanupTestUser
};
