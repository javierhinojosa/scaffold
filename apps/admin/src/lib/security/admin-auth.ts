import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthError, AuthErrorCode, type AdminUser, type Role } from './types';
import { cacheGet, cacheSet, clearCache } from './utils';

export class AdminAuthService {
  constructor(private supabase: SupabaseClient) {}

  async validateAdminRole(userId: string): Promise<Role> {
    const { data, error } = await this.supabase
      .from('admin_users')
      .select('role, permissions')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new AuthError(
        'User does not have admin access',
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        403
      );
    }

    return data.role;
  }

  async getAdminUser(userId: string): Promise<AdminUser> {
    const cacheKey = `admin_user:${userId}`;
    const cached = cacheGet<AdminUser>(cacheKey);
    if (cached) return cached;

    // Get user data using service role
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('id, email, created_at, updated_at, user_metadata')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new AuthError('Invalid user', AuthErrorCode.INVALID_SESSION);
    }

    const { data: adminData, error: adminError } = await this.supabase
      .from('admin_users')
      .select('role, permissions')
      .eq('user_id', userId)
      .single();

    if (adminError || !adminData) {
      throw new AuthError(
        'User does not have admin access',
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        403
      );
    }

    const adminUser: AdminUser = {
      ...userData,
      role: adminData.role,
      permissions: adminData.permissions,
    };

    cacheSet({ cache: { enabled: true, ttlMs: 5 * 60 * 1000 } }, cacheKey, adminUser);
    return adminUser;
  }

  async refreshSession(): Promise<void> {
    const { error } = await this.supabase.auth.refreshSession();
    if (error) {
      throw new AuthError('Failed to refresh session', AuthErrorCode.SESSION_EXPIRED);
    }
  }

  async recoverSession(refreshToken: string): Promise<void> {
    const { error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) {
      throw new AuthError('Failed to recover session', AuthErrorCode.INVALID_SESSION);
    }
  }

  hasPermission(user: AdminUser, permission: string): boolean {
    return user.permissions.includes(permission);
  }

  async signOut(userId: string): Promise<void> {
    clearCache(`admin_user:${userId}`);
  }

  isSuperAdmin(user: AdminUser): boolean {
    return user.role === 'super_admin';
  }
}
