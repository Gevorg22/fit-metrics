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
      const crypto2 = await import('crypto');
      const BOT = process.env.TELEGRAM_BOT_TOKEN!;

      // Try 1: exclude hash + signature (current approach)
      const r1 = new URLSearchParams(initData);
      r1.delete('hash'); r1.delete('signature');
      const dcs1 = Array.from(r1.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
      const sk1 = crypto2.createHmac('sha256','WebAppData').update(BOT).digest();
      const h1 = crypto2.createHmac('sha256',sk1).update(dcs1).digest('hex');
      console.log('[tg-auth] try1 (no sig):', h1, '| match:', h1 === hash);

      // Try 2: exclude only hash (include signature)
      const r2 = new URLSearchParams(initData);
      r2.delete('hash');
      const dcs2 = Array.from(r2.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
      const h2 = crypto2.createHmac('sha256',sk1).update(dcs2).digest('hex');
      console.log('[tg-auth] try2 (w/ sig):', h2, '| match:', h2 === hash);

      // Try 3: raw string split (no URLSearchParams decode), no signature
      const dcs3 = initData.split('&').filter((s: string) => !s.startsWith('hash=') && !s.startsWith('signature=')).sort().join('\n');
      const h3 = crypto2.createHmac('sha256',sk1).update(dcs3).digest('hex');
      console.log('[tg-auth] try3 (raw,no sig):', h3, '| match:', h3 === hash);

      // Try 4: raw string split, include signature
      const dcs4 = initData.split('&').filter((s: string) => !s.startsWith('hash=')).sort().join('\n');
      const h4 = crypto2.createHmac('sha256',sk1).update(dcs4).digest('hex');
      console.log('[tg-auth] try4 (raw,w/ sig):', h4, '| match:', h4 === hash);

      console.log('[tg-auth] dcs1:', JSON.stringify(dcs1));
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
