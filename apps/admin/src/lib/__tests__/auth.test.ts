import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { auth } from '../auth';
import { setupTestUser, cleanupTestUser, TEST_USER } from '@sfh/testing/auth';

describe('Authentication', () => {
  beforeAll(async () => {
    await setupTestUser();
  });

  afterAll(async () => {
    await cleanupTestUser();
  });

  it('should successfully sign in with correct credentials', async () => {
    const { user } = await auth.signInWithEmail(TEST_USER.email, TEST_USER.password);
    
    expect(user).toBeDefined();
    expect(user?.email).toBe(TEST_USER.email);
  });

  it('should fail to sign in with incorrect password', async () => {
    await expect(
      auth.signInWithEmail(TEST_USER.email, 'wrongpassword')
    ).rejects.toThrow();
  });

  it('should fail to sign in with non-existent user', async () => {
    await expect(
      auth.signInWithEmail('nonexistent@example.com', TEST_USER.password)
    ).rejects.toThrow();
  });

  it('should successfully sign out', async () => {
    // First sign in
    await auth.signInWithEmail(TEST_USER.email, TEST_USER.password);
    
    // Then sign out
    await auth.signOut();
    
    // Verify user is signed out
    const currentUser = await auth.getCurrentUser();
    expect(currentUser).toBeNull();
  });

  it('should maintain session after successful login', async () => {
    // Sign in
    await auth.signInWithEmail(TEST_USER.email, TEST_USER.password);
    
    // Get current user immediately after login
    const user1 = await auth.getCurrentUser();
    expect(user1?.email).toBe(TEST_USER.email);
    
    // Get current user again to verify session persistence
    const user2 = await auth.getCurrentUser();
    expect(user2?.email).toBe(TEST_USER.email);
  });
}); 