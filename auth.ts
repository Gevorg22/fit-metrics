import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Resend from 'next-auth/providers/resend';
import { Resend as ResendClient } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = new ResendClient(process.env.RESEND_API_KEY);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? 'fitMetrics <onboarding@resend.dev>',
      name: 'Email',
      generateVerificationToken: () => String(Math.floor(100000 + Math.random() * 900000)),
      sendVerificationRequest: async ({ identifier: email, token }) => {
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'fitMetrics <onboarding@resend.dev>',
          to: email,
          subject: 'Код входа в fitMetrics',
          html: `<div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:40px 24px;background:#0d0d0d;border-radius:12px;border:1px solid #2a2a2a;"><h2 style="color:#22c55e;margin:0 0 20px;font-size:22px;">fitMetrics</h2><p style="color:#a3a3a3;margin:0 0 6px;font-size:14px;">Твой код для входа:</p><div style="font-size:42px;font-weight:700;letter-spacing:10px;color:#22c55e;margin:12px 0 20px;font-family:monospace;">${token}</div><p style="color:#525252;font-size:12px;margin:0;">Код действителен 10 минут. Не передавай его никому.</p></div>`,
        });
        if (error) throw new Error(JSON.stringify(error));
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-otp',
    error: '/auth-error',
  },
  session: {
    strategy: 'database',
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
