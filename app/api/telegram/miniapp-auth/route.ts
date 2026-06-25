import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyTelegramInitData, getSessionCookieName } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    const params = verifyTelegramInitData(initData);
    if (!params) {
      return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
    }

    const userRaw = params.get('user');
    if (!userRaw) {
      return NextResponse.json({ error: 'No user in initData' }, { status: 401 });
    }

    const userData = JSON.parse(userRaw);
    const telegramId = String(userData.id);
    const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || null;

    let user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: userData.username ?? null,
          name,
          image: userData.photo_url ?? null,
        },
      });
    }

    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: { userId: user.id, sessionToken, expires },
    });

    const { name: cookieName, secure } = getSessionCookieName();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure,
      expires,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (e) {
    console.error('Telegram miniapp auth error:', e);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
