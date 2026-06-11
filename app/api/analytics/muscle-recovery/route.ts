import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - 14);

  const sets = await prisma.workoutSet.findMany({
    where: { workout: { userId: session.user.id, startedAt: { gte: since } } },
    select: { exerciseId: true, workout: { select: { startedAt: true } } },
    orderBy: { workout: { startedAt: 'desc' } },
  });

  if (!sets.length) return NextResponse.json({});

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true, primaryMuscles: true },
  });

  const muscleMap = Object.fromEntries(exercises.map((e) => [e.id, e.primaryMuscles]));

  const now = Date.now();
  const result: Record<string, number> = {};

  for (const s of sets) {
    const muscles = muscleMap[s.exerciseId] ?? [];
    const daysAgo = (now - s.workout.startedAt.getTime()) / 86_400_000;
    for (const m of muscles) {
      const key = m.toLowerCase();
      if (!(key in result) || daysAgo < result[key]) {
        result[key] = daysAgo;
      }
    }
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  });
}
