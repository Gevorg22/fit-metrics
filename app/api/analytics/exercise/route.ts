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

  const byDate = new Map<string, { maxWeight: number; maxReps: number; totalVolume: number }>();
  for (const s of sets) {
    const date = s.workout.startedAt.toISOString().slice(0, 10);
    const cur = byDate.get(date);
    const vol = s.weight * s.reps;
    if (!cur) {
      byDate.set(date, { maxWeight: s.weight, maxReps: s.reps, totalVolume: vol });
    } else {
      byDate.set(date, {
        maxWeight: Math.max(cur.maxWeight, s.weight),
        maxReps: Math.max(cur.maxReps, s.reps),
        totalVolume: cur.totalVolume + vol,
      });
    }
  }

  const data = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    maxWeight: v.maxWeight,
    maxReps: v.maxReps,
    totalVolume: Math.round(v.totalVolume),
  }));

  return NextResponse.json(data);
}
