import { createTestClient } from '@sfh/backend/test-utils';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@sfh/backend';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Debug log the values being used
console.log('Test client configuration:', {
  url: supabaseUrl,
  serviceKey: supabaseServiceKey ? supabaseServiceKey.slice(0, 10) + '...' : 'not set',
});

export const testClient: SupabaseClient<Database> = createTestClient(
  supabaseUrl,
  supabaseServiceKey
);

export const TEST_USER = {
  email: 'javiereh@pm.me',
  password: 'Stewart123!',
};

export async function setupTestUser() {
  try {
    // Delete the user if it exists
    const { data: existingUser, error: listError } = await testClient.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const userToDelete = existingUser?.users.find((u: User) => u.email === TEST_USER.email);
    if (userToDelete) {
      const { error: deleteError } = await testClient.auth.admin.deleteUser(userToDelete.id);
      if (deleteError) {
        console.error('Error deleting existing user:', deleteError);
        throw deleteError;
      }
    }

    // Create the test user
    const { data, error } = await testClient.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Auto-confirm the email
    });

    if (error) {
      console.error('Error creating test user:', error);
      throw error;
    }
    return data.user;
  } catch (error) {
    console.error('Error in setupTestUser:', error);
    throw error;
  }
}

export async function cleanupTestUser() {
  try {
    const { data: { users }, error: listError } = await testClient.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const testUser = users.find((u: User) => u.email === TEST_USER.email);
    if (testUser) {
      const { error: deleteError } = await testClient.auth.admin.deleteUser(testUser.id);
      if (deleteError) {
        console.error('Error deleting test user:', deleteError);
        throw deleteError;
      }
    }
  } catch (error) {
    console.error('Error in cleanupTestUser:', error);
    throw error;
  }
}
