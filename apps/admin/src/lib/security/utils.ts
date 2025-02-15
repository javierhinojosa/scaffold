import { createHash, randomBytes } from 'crypto';
import type { AstroCookies } from 'astro';
import { AuthError, AuthErrorCode, type SecurityConfig } from './types';
import { decode, type JWTPayload } from '@supabase/supabase-js';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const sessionCache = new Map<string, { data: any; expires: number }>();

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function validateCsrfToken(
  token: string | undefined,
  storedToken: string | undefined
): boolean {
  if (!token || !storedToken) return false;
  return token === storedToken;
}

export function handleCsrf(
  config: SecurityConfig,
  cookies: AstroCookies,
  method: string,
  path: string,
  headers: Headers
): void {
  if (!config.csrf.enabled || method === 'GET' || config.csrf.ignorePaths.includes(path)) {
    return;
  }

  const headerToken = headers.get(config.csrf.headerName);
  const cookieToken = cookies.get(config.csrf.cookieName)?.value;

  if (!validateCsrfToken(headerToken, cookieToken)) {
    throw new AuthError('Invalid CSRF token', AuthErrorCode.INVALID_CSRF, 403);
  }
}

export function setCsrfToken(config: SecurityConfig, cookies: AstroCookies): string {
  const token = generateCsrfToken();
  cookies.set(config.csrf.cookieName, token, config.csrf.cookieOptions);
  return token;
}

export function checkRateLimit(config: SecurityConfig, ip: string): void {
  if (!config.rateLimit.enabled) return;

  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (record) {
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + config.rateLimit.windowMs;
    } else if (record.count >= config.rateLimit.max) {
      throw new AuthError(config.rateLimit.message, AuthErrorCode.RATE_LIMITED, 429);
    } else {
      record.count++;
    }
  } else {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + config.rateLimit.windowMs,
    });
  }
}

export function cacheGet<T>(key: string): T | null {
  if (!sessionCache.has(key)) return null;

  const cached = sessionCache.get(key);
  if (!cached || Date.now() > cached.expires) {
    sessionCache.delete(key);
    return null;
  }

  return cached.data as T;
}

export function cacheSet<T>(config: SecurityConfig, key: string, data: T): void {
  if (!config.cache.enabled) return;

  sessionCache.set(key, {
    data,
    expires: Date.now() + config.cache.ttlMs,
  });
}

export function clearCache(key: string): void {
  sessionCache.delete(key);
}

export function setSecurityHeaders(headers: Headers, config: SecurityConfig): void {
  Object.entries(config.headers).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export function shouldRefreshSession(expiresAt: number, config: SecurityConfig): boolean {
  const expiresAtMs = expiresAt * 1000;
  const now = Date.now();
  return expiresAtMs - now < config.session.refreshThresholdMs;
}

export function clearRateLimits(): void {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

export async function verifyJWT(jwt: string): Promise<JWTPayload> {
  try {
    const { payload } = decode(jwt);
    if (!payload || !payload.sub) {
      throw new AuthError('Invalid JWT', AuthErrorCode.INVALID_SESSION);
    }
    return payload;
  } catch (error) {
    throw new AuthError('Invalid JWT', AuthErrorCode.INVALID_SESSION);
  }
}
