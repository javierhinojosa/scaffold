import * as _supabase_supabase_js from '@supabase/supabase-js';
import { SupabaseClient, User } from '@supabase/supabase-js';
export { AuthError, AuthResponse, AuthTokenResponse, Session, User } from '@supabase/supabase-js';
import { D as Database } from './types-DFuXh4Df.mjs';

type AuthStore = {
    user: User | null;
    loading: boolean;
};
declare class Auth {
    private supabaseClient;
    constructor(supabaseUrl: string, supabaseKey: string);
    get client(): SupabaseClient<Database, "public", any>;
    signInWithEmail(email: string, password: string): Promise<{
        user: User;
        session: _supabase_supabase_js.AuthSession;
    }>;
    signUp(email: string, password: string): Promise<{
        user: User | null;
        session: _supabase_supabase_js.AuthSession | null;
    }>;
    signOut(): Promise<void>;
    getCurrentUser(): Promise<User | null>;
    onAuthStateChange(callback: (user: User | null) => void): {
        data: {
            subscription: _supabase_supabase_js.Subscription;
        };
    };
}
type CreateAuthStore<T> = (options: {
    auth: Auth;
    createStore: (value: AuthStore) => T;
}) => T;
declare function createSvelteAuthStore(options: {
    auth: Auth;
    createStore: (value: AuthStore) => any;
}): any;

declare const createSupabaseClient: (supabaseUrl: string, supabaseKey: string) => _supabase_supabase_js.SupabaseClient<Database, "public", any>;
declare const getSupabaseClient: () => _supabase_supabase_js.SupabaseClient<Database, "public", any>;
declare function createSupabaseAuth(supabaseUrl: string, supabaseKey: string): Auth;

export { Auth, type AuthStore, type CreateAuthStore, Database, createSupabaseAuth, createSupabaseClient, createSvelteAuthStore, getSupabaseClient };
