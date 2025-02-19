import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function onRequest(
  { locals, cookies, url }: { locals: Record<string, any>; cookies: Record<string, any>; url: URL },
  next: () => Promise<Response>
) {

  let session = null;
  const supabase = createServerClient(
    'https://tgynpeuajacrkzgkcsfy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneW5wZXVhamFjcmt6Z2tjc2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1Njk4NDksImV4cCI6MjA1NTE0NTg0OX0.z_Zt7whfq0UR0rCyysfjq1lDeu_zK4JD9b1MzplCYOg',
    {
      cookies: {
        get: (key: string) => cookies.get(key)?.value,
        set: (key: string, value: string, options: CookieOptions) => cookies.set(key, value, options),
        remove: (key: string, options: CookieOptions) => cookies.delete(key, options),
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();

  // if (error || !user) {
  //   return Response.redirect(new URL('/auth/login', url));
  // }

  if (user) {
    console.log('User is logged in', user.id);
    locals.isLoggedIn = true;
    locals.message = 'User is logged in';
    locals.email = user.email;
    locals.user_id = user.id;

    // const { data: profileData } = await supabase
    //   .from('profiles')
    //   .select('full_name, dark_mode, avatar_url')
    //   .eq('id', user.id)
    //   .single();

    // locals.full_name = profileData?.full_name;
    // locals.dark_mode = profileData?.dark_mode;
    // locals.avatar_url = profileData?.avatar_url;

    // Get the role_ids from the user_roles table
    // const { data: userRolesData } = await supabase
    //   .from('user_roles')
    //   .select('role_id')
    //   .eq('user_id', user.id);

    // if (userRolesData) {
    //   // Get the role names from the roles table
    //   const roleIds = userRolesData.map((userRole) => userRole.role_id);
    //   const { data: rolesData } = await supabase
    //     .from('roles')
    //     .select('name')
    //     .in('id', roleIds);

    //   if (rolesData) {
    //     locals.roles = rolesData.map((role) => role.name);
    //   }
    // }

    
  } else {
    console.log('No active session');
    locals.isLoggedIn = false;
    locals.message = 'No active session';
    locals.email = null;
  }


  return next();
}
