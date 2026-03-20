import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

const PROTECTED_PATHS = ['/dashboard', '/add-trade'];
const AUTH_PATHS = ['/login'];

function isProtected(pathname) {
  return PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  );
}

function isAuthPath(pathname) {
  return AUTH_PATHS.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  );
}

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createClient(request, response);

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users from protected routes to login
  if (isProtected(pathname) && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth pages to dashboard
  if (isAuthPath(pathname) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
