import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Protected routes: only signed-in users may access these.
const PROTECTED_ROUTES = ['/items/new', '/dashboard']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() also refreshes the session if expired. Do not
  // replace with getSession() — that does not validate the token server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Send signed-in users away from the auth pages.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // IMPORTANT: return the supabaseResponse so any refreshed session cookies
  // set during the request are propagated to the browser.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image
     * - favicon.ico and other static assets
     * - the /auth/confirm callback (needs no forwarding of stale cookies)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
