import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.telegramLoginToken.create({ data: { token, expiresAt } });

  return NextResponse.json({ token });
}
