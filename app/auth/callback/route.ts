import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Default redirect path if it's a standard login
  const next = searchParams.get('next') ?? '/discover';

  if (code) {
    // FIX: Await the cookies() function for Next.js 14.2/15 compatibility
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
      // MAGIC TRICK: Check if this is a brand new user 
      // (Account created within the last 2 minutes)
      const createdAt = new Date(data.user.created_at).getTime();
      const now = new Date().getTime();
      const isNewUser = (now - createdAt) < 120000; // 120,000 milliseconds = 2 mins

      if (isNewUser) {
        // FIX: Redirect to the user's personal profile page with the trigger attached!
        return NextResponse.redirect(`${origin}/profile/${data.user.id}?setupProfile=true`);
      }

      // Route existing returning users to the home/discover feed
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If the link is expired or something fails, send them back to login with an error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}