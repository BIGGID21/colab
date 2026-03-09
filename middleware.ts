import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // 1. THE WEBHOOK BYPASS (The Fix!)
  // If the request is going to any /api route, we skip the auth checks entirely.
  // This prevents the middleware from interfering with Paystack's POST request.
  if (url.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // 2. Initialize the response for standard pages
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 3. Initialize Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 4. Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // 5. Route Guard Logic
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup'
  
  const isProtectedRoute = [
    '/notifications', 
    '/manage', 
    '/create', 
    '/my-projects', 
    '/dashboard'
  ].some(path => url.pathname.startsWith(path))

  if (!user && isProtectedRoute) {
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname) 
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    url.pathname = '/discover'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
