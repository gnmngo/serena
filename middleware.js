// middleware.js – place in project root
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // All routes that require authentication (login required)
  const protectedRoutes = [
    '/transparency',
    '/announcements',
    '/suggest',
    '/suggestions-board',
    '/events',
    '/student',
    '/faculty',
    '/admin',
  ]
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isPublicAsset = request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)

  // Redirect unauthenticated users to login
  if (!user && isProtected && !isPublicAsset && !isLoginPage) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from login page to their dashboard
  if (user && isLoginPage) {
    // You can optionally redirect to role‑based dashboard here
    // For simplicity, redirect to transparency board (will be overridden by role redirect after login)
    const redirectUrl = new URL('/transparency', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}