import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getSessionCookieName } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const record = await prisma.telegramLoginToken.findUnique({ where: { token } });

  if (!record) return NextResponse.json({ status: 'not_found' }, { status: 404 });
  if (record.expiresAt < new Date()) {
    await prisma.telegramLoginToken.delete({ where: { token } });
    return NextResponse.json({ status: 'expired' });
  }
  if (!record.confirmed || !record.userData) return NextResponse.json({ status: 'pending' });

  // Token confirmed — create session
  const userData = record.userData as any;
  const telegramId = String(userData.id);
  const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || null;

  let user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    user = await prisma.user.create({
      data: { telegramId, telegramUsername: userData.username ?? null, name, image: userData.photo_url ?? null },
    });
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId: user.id, sessionToken, expires } });

  await prisma.telegramLoginToken.delete({ where: { token } });

  const { name: cookieName, secure } = getSessionCookieName();
  const response = NextResponse.json({ status: 'ok' });
  response.cookies.set(cookieName, sessionToken, { httpOnly: true, secure, expires, sameSite: 'lax', path: '/' });

  return response;
}
