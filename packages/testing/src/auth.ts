import { createTestClient } from '@sfh/backend/test-utils';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@sfh/backend';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const testClient: SupabaseClient<Database> = createTestClient(
  supabaseUrl,
  supabaseServiceKey
);

export const TEST_USER = {
  email: 'javiereh@pm.me',
  password: 'Stewart123!',
};

export async function setupTestUser() {
  // Delete the user if it exists
  const { data: existingUser } = await testClient.auth.admin.listUsers();
  const userToDelete = existingUser?.users.find((u: User) => u.email === TEST_USER.email);
  if (userToDelete) {
    await testClient.auth.admin.deleteUser(userToDelete.id);
  }

  // Create the test user
  const { data, error } = await testClient.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true, // Auto-confirm the email
  });

  if (error) throw error;
  return data.user;
}

export async function cleanupTestUser() {
  const {
    data: { users },
  } = await testClient.auth.admin.listUsers();
  const testUser = users.find((u: User) => u.email === TEST_USER.email);
  if (testUser) {
    await testClient.auth.admin.deleteUser(testUser.id);
  }
}
