import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSupabaseAuth } from '../index';
import { setupTestUser, cleanupTestUser, TEST_USER, testClient } from '../../../testing/src/auth';

describe('Auth', () => {
  // Create auth instance with service key for admin operations
  console.log('Creating auth instance with:', {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY,
    // Log the actual values for debugging
    urlValue: process.env.SUPABASE_URL,
    keyValue: process.env.SUPABASE_SERVICE_KEY,
  });
  const auth = createSupabaseAuth(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  beforeAll(async () => {
    // Use testClient (with service key) for admin operations
    await setupTestUser();
  });

  afterAll(async () => {
    // Use testClient (with service key) for admin operations
    await cleanupTestUser();
  });

  it('should create an auth instance', () => {
    expect(auth).toBeDefined();
  });

  it('should sign in with correct credentials', async () => {
    const { user } = await auth.signInWithEmail(TEST_USER.email, TEST_USER.password);
    expect(user).toBeDefined();
    expect(user?.email).toBe(TEST_USER.email);
  });

  it('should fail to sign in with incorrect password', async () => {
    await expect(auth.signInWithEmail(TEST_USER.email, 'wrongpassword')).rejects.toThrow();
  });

  it('should sign up a new user', async () => {
    const testEmail = 'test.signup.new@gmail.com';
    const testPassword = 'TestPassword123!';

    try {
      // First cleanup any existing test user using admin client
      const {
        data: { users },
      } = await testClient.auth.admin.listUsers();
      const existingUser = users.find((u) => u.email === testEmail);
      if (existingUser) {
        await testClient.auth.admin.deleteUser(existingUser.id);
      }

      // Then try to sign up using public client
      const { user } = await auth.signUp(testEmail, testPassword);
      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
    } finally {
      // Clean up the test user using admin client
      const {
        data: { users },
      } = await testClient.auth.admin.listUsers();
      const testUser = users.find((u) => u.email === testEmail);
      if (testUser) {
        await testClient.auth.admin.deleteUser(testUser.id);
      }
    }
  });

  it('should sign out successfully', async () => {
    // First sign in and get the session
    const {
      data: { session },
      error,
    } = await auth.client.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(error).toBeNull();
    expect(session).toBeDefined();

    // Then sign out
    await auth.signOut();

    // Verify session is cleared
    const {
      data: { session: currentSession },
    } = await auth.client.auth.getSession();
    expect(currentSession).toBeNull();
  });

  it('should get current user after login', async () => {
    // Sign in
    await auth.signInWithEmail(TEST_USER.email, TEST_USER.password);

    // Get current user
    const user = await auth.getCurrentUser();
    expect(user).toBeDefined();
    expect(user?.email).toBe(TEST_USER.email);
  });

  it('should handle auth state changes', async () => {
    let authStateUser: any = null;

    // Set up auth state listener
    const {
      data: { subscription },
    } = auth.client.auth.onAuthStateChange((_event, session) => {
      authStateUser = session?.user ?? null;
    });

    try {
      // Sign in and verify state change
      await auth.signInWithEmail(TEST_USER.email, TEST_USER.password);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for state update
      expect(authStateUser?.email).toBe(TEST_USER.email);

      // Sign out and verify state change
      await auth.signOut();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for state update
      expect(authStateUser).toBeNull();
    } finally {
      subscription.unsubscribe();
    }
  });
});
