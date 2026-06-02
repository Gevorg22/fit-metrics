import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const logs = await prisma.weightLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'asc' },
    select: { id: true, weight: true, date: true },
  });

  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { weight } = await req.json();
  if (!weight || typeof weight !== 'number' || weight <= 0) {
    return NextResponse.json({ error: 'Некорректное значение веса' }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.weightLog.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    update: { weight },
    create: { userId: session.user.id, weight, date: today },
  });

  return NextResponse.json(log);
}
