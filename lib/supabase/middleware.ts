import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // @supabase/ssr ≥ 0.12 passes a second `headers` argument that MUST
        // be forwarded to the response so Vercel Edge / CDNs never cache auth
        // responses (Cache-Control: private, no-store etc.)
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // IMPORTANT: nothing must execute between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPath = path.startsWith('/login') || path.startsWith('/auth')

  if (!user && !isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const res = NextResponse.redirect(url)
    // Prevent edge caching of auth redirects
    res.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0')
    supabaseResponse.cookies.getAll().forEach(({ name, value }) =>
      res.cookies.set(name, value)
    )
    return res
  }

  if (user && path.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/hoje'
    const res = NextResponse.redirect(url)
    res.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0')
    supabaseResponse.cookies.getAll().forEach(({ name, value }) =>
      res.cookies.set(name, value)
    )
    return res
  }

  return supabaseResponse
}
