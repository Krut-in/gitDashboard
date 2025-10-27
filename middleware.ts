/**
 * Middleware - Route Protection
 * 
 * This middleware runs before every request to protected routes.
 * It checks if users are authenticated before allowing access to /dashboard routes.
 * Unauthenticated users are redirected to the home page to sign in.
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  // Redirect to home page if accessing dashboard without authentication
  if (isDashboard && !session) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
