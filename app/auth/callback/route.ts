import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Default redirect path if it's a standard login
  const next = searchParams.get('next') ?? '/discover';

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const createdAt = new Date(data.user.created_at).getTime();
      const now = new Date().getTime();
      const isNewUser = (now - createdAt) < 120000; // 2 mins

      if (isNewUser) {
        // THE FIX IS HERE: We strictly route to /profile without the user ID
        return NextResponse.redirect(`${origin}/profile?setupProfile=true`);
      }

      // Route existing returning users to the home/discover feed
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If the link is expired or something fails, send them back to login with an error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}