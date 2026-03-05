import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Fixing the cookie error for Vercel
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Use "next" param to determine the destination, defaulting to /discover
  const next = searchParams.get('next') ?? '/discover';

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Exchange the temporary code for a permanent session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  // FAILSAFE: If auth fails, redirect to login with a specific error 
  // rather than letting the user hit a 404 on a broken callback URL.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}