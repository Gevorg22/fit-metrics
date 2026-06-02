import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { PeriodFilter } from '@/types';

function getStartDate(period: PeriodFilter): Date {
  const now = new Date();
  if (period === '1m') {
    now.setMonth(now.getMonth() - 1);
  } else if (period === '3m') {
    now.setMonth(now.getMonth() - 3);
  } else {
    now.setFullYear(now.getFullYear() - 1);
  }
  return now;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') ?? '1m') as PeriodFilter;

  const startDate = getStartDate(period);

  const logs = await prisma.weightLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
    select: { weight: true, date: true },
  });

  return NextResponse.json(
    logs.map((l) => ({ weight: l.weight, date: l.date.toISOString().split('T')[0] }))
  );
}
