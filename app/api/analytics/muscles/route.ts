import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const sets = await prisma.workoutSet.findMany({
    where: { workout: { userId: session.user.id, startedAt: { gte: since } } },
    select: { exerciseId: true },
  });

  if (sets.length === 0) return NextResponse.json({});

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];

  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true, primaryMuscles: true },
  });

  const setCounts = sets.reduce<Record<string, number>>((acc, s) => {
    acc[s.exerciseId] = (acc[s.exerciseId] ?? 0) + 1;
    return acc;
  }, {});

  const result: Record<string, number> = {};
  for (const ex of exercises) {
    const n = setCounts[ex.id] ?? 0;
    for (const m of ex.primaryMuscles) {
      const key = m.toLowerCase();
      result[key] = (result[key] ?? 0) + n;
    }
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  });
}
