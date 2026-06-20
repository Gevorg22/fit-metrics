import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [],
  trustHost: true,
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-otp',
    error: '/auth-error',
  },
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 90,
    updateAge: 60 * 60 * 24 * 7,
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
