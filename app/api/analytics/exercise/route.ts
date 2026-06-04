import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get('exerciseId');
  if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });

  const sets = await prisma.workoutSet.findMany({
    where: {
      exerciseId,
      workout: { userId: session.user.id },
    },
    select: {
      weight: true,
      reps: true,
      workout: { select: { startedAt: true } },
    },
    orderBy: { workout: { startedAt: 'asc' } },
  });

  const byDate = new Map<string, { maxWeight: number; maxReps: number }>();
  for (const s of sets) {
    const date = s.workout.startedAt.toISOString().slice(0, 10);
    const cur = byDate.get(date);
    if (!cur || s.weight > cur.maxWeight) {
      byDate.set(date, { maxWeight: s.weight, maxReps: s.reps });
    }
  }

  const data = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    maxWeight: v.maxWeight,
    maxReps: v.maxReps,
  }));

  return NextResponse.json(data);
}
