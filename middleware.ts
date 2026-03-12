import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // 1. THE WEBHOOK BYPASS
  if (url.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // 2. Initialize the response early
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
          // Instead of re-assigning response = NextResponse.next(), 
          // we just update the existing objects.
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 4. Refresh session
  // IMPORTANT: Use getUser() as it's more secure than getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // 5. Route Guard Logic
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup'
  
  const protectedRoutes = ['/notifications', '/manage', '/create', '/my-projects', '/dashboard', '/community-feed'] // Added community-feed just in case
  const isProtectedRoute = protectedRoutes.some(path => url.pathname.startsWith(path))

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', request.nextUrl.pathname) 
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard' // or /discover
    return NextResponse.redirect(redirectUrl)
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