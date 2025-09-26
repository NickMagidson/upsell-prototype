import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const user = await supabase.auth.getUser();

    // Don't redirect on auth callback routes
    if (request.nextUrl.pathname.startsWith('/auth/callback')) {
      return response;
    }

    // Protected routes - redirect unauthenticated users to login instead of register
    if (request.nextUrl.pathname === '/' && user.error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect logged in users from auth pages
    if (
      (request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/register') &&
      !user.error
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
