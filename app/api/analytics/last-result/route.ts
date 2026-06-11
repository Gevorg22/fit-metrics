import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get('exerciseId');
  const currentWorkoutId = searchParams.get('currentWorkoutId');

  if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });

  const rows = await prisma.workoutSet.findMany({
    where: {
      exerciseId,
      workout: {
        userId: session.user.id,
        ...(currentWorkoutId ? { id: { not: currentWorkoutId } } : {}),
      },
    },
    select: {
      setNumber: true,
      weight: true,
      reps: true,
      workoutId: true,
      workout: { select: { startedAt: true } },
    },
    orderBy: [{ workout: { startedAt: 'desc' } }, { setNumber: 'asc' }],
    take: 30,
  });

  if (!rows.length) return NextResponse.json(null);

  const latestWorkoutId = rows[0].workoutId;
  const sets = rows
    .filter((r) => r.workoutId === latestWorkoutId)
    .map((r) => ({ setNumber: r.setNumber, weight: r.weight, reps: r.reps }));

  return NextResponse.json({
    date: rows[0].workout.startedAt.toISOString().slice(0, 10),
    sets,
  });
}
