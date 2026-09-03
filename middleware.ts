import { NextResponse, type NextRequest } from 'next/server';

/**
 * Дешёвая отсечка неавторизованных на Edge.
 *
 * Полная проверка сессии остаётся на страницах и в API-роутах: сессии лежат в БД,
 * и Edge до Postgres не ходит. Здесь смотрим только наличие куки — это отсекает
 * анонимные заходы до того, как поднимется Node-функция и отрендерится SSR,
 * то есть до того, как начнёт тратиться Fluid Active CPU. Подделанная кука
 * ничего не даёт: `getSession()` на странице вернёт null и уведёт на /login.
 */
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];

export function middleware(request: NextRequest) {
  const { cookies, nextUrl } = request;

  const hasSession = SESSION_COOKIES.some((name) => cookies.has(name));
  const isGuest = cookies.get('fitmetrics-guest')?.value === '1';

  if (hasSession || isGuest) return NextResponse.next();

  const url = nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workout/:path*',
    '/history/:path*',
    '/profile/:path*',
    '/nutrition/:path*',
    '/leaderboard/:path*',
    '/report/:path*',
  ],
};
