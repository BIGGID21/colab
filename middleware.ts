import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialize the response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Initialize Supabase with automated cookie handling
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

  // 3. IMPORTANT: This refreshes the session if it's expired
  const { data: { user } } = await supabase.auth.getUser()

  // 4. ROUTE GUARD LOGIC: The "404 Killer"
  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup'
  
  // Define your protected routes (where unauthenticated users should NEVER land)
  const isProtectedRoute = [
    '/notifications', 
    '/manage', 
    '/create', 
    '/my-projects', 
    '/dashboard'
  ].some(path => url.pathname.startsWith(path))

  // CASE A: User is NOT logged in but trying to access a protected app page
  if (!user && isProtectedRoute) {
    url.pathname = '/login'
    // We add a 'next' param so they return to where they were after login
    url.searchParams.set('next', request.nextUrl.pathname) 
    return NextResponse.redirect(url)
  }

  // CASE B: User IS logged in but trying to access login/signup pages
  if (user && isAuthPage) {
    url.pathname = '/discover'
    return NextResponse.redirect(url)
  }

  return response
}

// 5. MATCHER: Tells Next.js which routes to run this middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}