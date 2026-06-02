import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/verify-request', '/verify-otp', '/auth-error'];
const PUBLIC_API_PATHS = ['/api/auth', '/api/otp', '/api/exercises'];

export default function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));

    if (isPublic || isPublicApi) return NextResponse.next();

    const isGuest = req.cookies.get('fitmetrics-guest')?.value === '1';
    const hasSession =
      req.cookies.has('authjs.session-token') ||
      req.cookies.has('__Secure-authjs.session-token');

    if (!hasSession && !isGuest) {
      const isApiRoute = pathname.startsWith('/api/');
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if ((hasSession || isGuest) && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
