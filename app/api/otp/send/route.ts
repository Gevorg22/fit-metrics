import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const identifier = `otp:${email}`;

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({ data: { identifier, token: code, expires } });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'fitMetrics <onboarding@resend.dev>',
      to: email,
      subject: 'Код входа в fitMetrics',
      html: `<div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:40px 24px;background:#0d0d0d;border-radius:12px;border:1px solid #2a2a2a;"><h2 style="color:#22c55e;margin:0 0 20px;font-size:22px;">fitMetrics</h2><p style="color:#a3a3a3;margin:0 0 6px;font-size:14px;">Твой код для входа:</p><div style="font-size:42px;font-weight:700;letter-spacing:10px;color:#22c55e;margin:12px 0 20px;font-family:monospace;">${code}</div><p style="color:#525252;font-size:12px;margin:0;">Код действителен 10 минут. Не передавай его никому.</p></div>`,
    });

    if (error) throw new Error(JSON.stringify(error));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('OTP send error:', e);
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 });
  }
}
