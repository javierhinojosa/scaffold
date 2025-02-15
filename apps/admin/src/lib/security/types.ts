import type { User } from '@supabase/supabase-js';

export type Role = 'admin' | 'super_admin';
export type AdminUser = User & {
  role: Role;
  permissions: string[];
};

export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_CSRF = 'INVALID_CSRF',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_SESSION = 'INVALID_SESSION',
  INVALID_ROLE = 'INVALID_ROLE',
}

export interface SecurityConfig {
  csrf: {
    enabled: boolean;
    ignorePaths: string[];
    headerName: string;
    cookieName: string;
    cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
    };
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    max: number;
    message: string;
  };
  session: {
    refreshThresholdMs: number;
    maxAgeMs: number;
  };
  cache: {
    enabled: boolean;
    ttlMs: number;
  };
  headers: {
    [key: string]: string;
  };
}

export const defaultSecurityConfig: SecurityConfig = {
  csrf: {
    enabled: true,
    ignorePaths: ['/login', '/logout'],
    headerName: 'x-csrf-token',
    cookieName: 'csrf-token',
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    },
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later',
  },
  session: {
    refreshThresholdMs: 30 * 60 * 1000, // 30 minutes
    maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  cache: {
    enabled: true,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  },
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    'X-XSS-Protection': '1; mode=block',
  },
};
