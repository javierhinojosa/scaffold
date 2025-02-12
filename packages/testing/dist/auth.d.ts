import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '@sfh/backend';

declare const testClient: SupabaseClient<Database>;
declare const TEST_USER: {
    email: string;
    password: string;
};
declare function setupTestUser(): Promise<User>;
declare function cleanupTestUser(): Promise<void>;

export { TEST_USER, cleanupTestUser, setupTestUser, testClient };
