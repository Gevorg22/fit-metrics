import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get('cursor');
  const exerciseId = searchParams.get('exerciseId') ?? undefined;
  const userId = session.user.id;

  const where = exerciseId
    ? { userId, sets: { some: { exerciseId } } }
    : { userId };

  const workouts = await prisma.workout.findMany({
    where,
    orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sets: { orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }] },
    },
  });

  const hasMore = workouts.length > PAGE_SIZE;
  const items = hasMore ? workouts.slice(0, PAGE_SIZE) : workouts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    workouts: items.map((w) => ({
      id: w.id,
      startedAt: w.startedAt.toISOString(),
      finishedAt: w.finishedAt?.toISOString() ?? null,
      notes: w.notes ?? null,
      sets: w.sets.map((s) => ({
        id: s.id,
        exerciseId: s.exerciseId,
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
      })),
    })),
    nextCursor,
  });
}
