import type { APIRoute } from 'astro';
import { createClient } from '../../lib/auth';
import { AuthError, AuthErrorCode } from '../../lib/security/types';
import { checkRateLimit, hashIp } from '../../lib/security/utils';
import { defaultSecurityConfig } from '../../lib/security/types';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    // Rate limit check
    const hashedIp = hashIp(clientAddress);
    checkRateLimit(defaultSecurityConfig, hashedIp);

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      throw new AuthError('Missing credentials', AuthErrorCode.INVALID_CREDENTIALS);
    }

    const supabase = createClient({
      get: (name) => cookies.get(name)?.value,
      set: (name, value, options) => cookies.set(name, value, options),
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new AuthError('Invalid credentials', AuthErrorCode.INVALID_CREDENTIALS);
    }

    // Verify admin access
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', data.session.user.id)
      .single();

    if (adminError || !adminData) {
      throw new AuthError(
        'User does not have admin access',
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        403
      );
    }

    // Set secure cookie with JWT
    cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
        }),
        {
          status: error.status,
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
      }
    );
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  // Clear auth cookie on logout
  cookies.delete('sb-access-token', {
    path: '/',
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
  });
};
