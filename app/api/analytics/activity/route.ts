import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - 364);
  since.setHours(0, 0, 0, 0);

  const workouts = await prisma.workout.findMany({
    where: { userId: session.user.id, startedAt: { gte: since }, finishedAt: { not: null } },
    select: { startedAt: true },
  });

  const counts: Record<string, number> = {};
  for (const w of workouts) {
    const date = w.startedAt.toISOString().slice(0, 10);
    counts[date] = (counts[date] ?? 0) + 1;
  }

  return NextResponse.json(counts);
}
