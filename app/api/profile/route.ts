import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const [workouts, sets, topExercisesRaw] = await Promise.all([
    prisma.workout.findMany({
      where: { userId },
      select: { startedAt: true, finishedAt: true },
    }),
    prisma.workoutSet.findMany({
      where: { workout: { userId } },
      select: { weight: true, reps: true },
    }),
    prisma.workoutSet.groupBy({
      by: ['exerciseId'],
      where: { workout: { userId } },
      _count: { _all: true },
      orderBy: { _count: { exerciseId: 'desc' } },
      take: 5,
    }),
  ]);

  const totalWorkouts = workouts.length;
  const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);

  const durationsMs = workouts
    .filter((w) => w.finishedAt)
    .map((w) => new Date(w.finishedAt!).getTime() - new Date(w.startedAt).getTime());
  const avgDurationMin = durationsMs.length
    ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length / 60000)
    : 0;

  const topIds = topExercisesRaw.map((r) => r.exerciseId);
  const exercises = topIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: topIds } },
        select: { id: true, name: true, nameRu: true },
      })
    : [];
  const nameMap = Object.fromEntries(exercises.map((e) => [e.id, e.nameRu ?? e.name]));

  const topExercises = topExercisesRaw.map((r) => ({
    exerciseId: r.exerciseId,
    name: nameMap[r.exerciseId] ?? r.exerciseId,
    count: r._count._all,
  }));

  return NextResponse.json({
    totalWorkouts,
    totalVolume: Math.round(totalVolume),
    avgDurationMin,
    topExercises,
    email: session.user.email ?? '',
  });
}
