import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      workouts: {
        where: { finishedAt: { not: null } },
        orderBy: { startedAt: 'desc' },
        take: 50,
        select: {
          startedAt: true,
          finishedAt: true,
          sets: {
            select: { weight: true, reps: true, exerciseId: true },
          },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allSets = user.workouts.flatMap((w) => w.sets);
  const totalVolume = Math.round(allSets.reduce((s, x) => s + x.weight * x.reps, 0));
  const maxWeight = allSets.length > 0 ? Math.max(...allSets.map((s) => s.weight)) : 0;
  const workoutCount = user.workouts.length;

  const totalDurMin = user.workouts.reduce((s, w) => {
    if (!w.finishedAt) return s;
    return s + Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000);
  }, 0);

  const byExercise = new Map<string, number>();
  for (const s of allSets) {
    byExercise.set(s.exerciseId, (byExercise.get(s.exerciseId) ?? 0) + 1);
  }
  const topExerciseId = [...byExercise.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  let topExerciseName: string | null = null;
  if (topExerciseId) {
    const ex = await prisma.exercise.findUnique({
      where: { id: topExerciseId },
      select: { nameRu: true, name: true },
    });
    topExerciseName = ex?.nameRu ?? ex?.name ?? null;
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' });

  return NextResponse.json({
    displayName: user.name?.trim() || maskEmail(user.email),
    image: user.image ?? null,
    memberSince,
    workoutCount,
    totalVolume,
    maxWeight,
    totalDurMin,
    topExerciseName,
  });
}
