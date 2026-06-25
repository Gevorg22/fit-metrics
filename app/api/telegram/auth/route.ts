import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyTelegramLogin, getSessionCookieName } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!verifyTelegramLogin(data)) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });
    }

    const authDate = parseInt(data.auth_date ?? '0');
    if (Date.now() / 1000 - authDate > 300) {
      return NextResponse.json({ error: 'Auth data expired' }, { status: 401 });
    }

    const telegramId = String(data.id);
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    let user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: data.username ?? null,
          name,
          image: data.photo_url ?? null,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { telegramUsername: data.username ?? null },
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
    console.error('Telegram auth error:', e);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
