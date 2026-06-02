import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    }

    const identifier = `otp:${email}`;

    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier, token: code } },
    });

    if (!record) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token: code } },
      });
      return NextResponse.json({ error: 'expired' }, { status: 400 });
    }

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: code } },
    });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, emailVerified: new Date() } });
    } else if (!user.emailVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    }

    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: { userId: user.id, sessionToken, expires },
    });

    const isSecure = process.env.NODE_ENV === 'production';
    const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';

    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      expires,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (e) {
    console.error('OTP verify error:', e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
