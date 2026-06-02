import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/otp') ||
    pathname.startsWith('/api/exercises') ||
    pathname === '/login' ||
    pathname === '/verify-otp' ||
    pathname === '/auth-error' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const isGuest = req.cookies.get('fitmetrics-guest')?.value === '1';
  const hasSession =
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token');

  if (!hasSession && !isGuest) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
