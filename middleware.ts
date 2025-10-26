/**
 * Middleware - Route Protection
 * 
 * This middleware runs before every request to protected routes.
 * It checks if users are authenticated before allowing access to /dashboard routes.
 * Unauthenticated users are redirected to the sign-in page.
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  // Redirect to sign-in if accessing dashboard without authentication
  if (isDashboard && !session) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if already signed in and trying to access sign-in
  if (isAuthPage && session) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in'],
};
