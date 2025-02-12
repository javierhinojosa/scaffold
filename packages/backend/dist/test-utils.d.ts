import { SupabaseClient, User } from '@supabase/supabase-js';
import { D as Database } from './types-DFuXh4Df.js';

declare function createTestClient(supabaseUrl: string, supabaseKey: string): SupabaseClient<Database>;
declare function createMockUser(overrides?: Partial<User>): User;
declare function createMockSession(user?: User): {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
    user: User;
};

export { createMockSession, createMockUser, createTestClient };
