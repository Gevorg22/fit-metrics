import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyTelegramInitData, getSessionCookieName } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    // Debug: log what we receive (remove after fix)
    const raw = new URLSearchParams(initData);
    const fields = Array.from(raw.keys()).join(', ');
    const hash = raw.get('hash');
    console.log('[tg-auth] fields:', fields);
    console.log('[tg-auth] hash from client:', hash);
    console.log('[tg-auth] BOT_TOKEN set:', !!process.env.TELEGRAM_BOT_TOKEN);
    console.log('[tg-auth] BOT_TOKEN length:', process.env.TELEGRAM_BOT_TOKEN?.length);

    const params = verifyTelegramInitData(initData);
    if (!params) {
      // Compute and log expected hash for comparison
      const crypto2 = await import('crypto');
      raw.delete('hash');
      raw.delete('signature');
      const dcs = Array.from(raw.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
      const sk = crypto2.createHmac('sha256','WebAppData').update(process.env.TELEGRAM_BOT_TOKEN!).digest();
      const expected = crypto2.createHmac('sha256',sk).update(dcs).digest('hex');
      console.log('[tg-auth] expected hash:', expected);
      console.log('[tg-auth] client hash:  ', hash);
      console.log('[tg-auth] match:', expected === hash);
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
