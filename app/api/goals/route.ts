import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { unauthorized, badRequest } from '@/lib/api-response';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const userId = session.user.id;

  const goals = await prisma.exerciseGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  const withProgress = await Promise.all(
    goals.map(async (g) => {
      const best = await prisma.workoutSet.aggregate({
        where: { workout: { userId }, exerciseId: g.exerciseId },
        _max: { weight: true },
      });
      return {
        id: g.id,
        exerciseId: g.exerciseId,
        exerciseName: g.exerciseName,
        targetWeight: g.targetWeight,
        targetDate: g.targetDate.toISOString().slice(0, 10),
        currentWeight: best._max.weight ?? 0,
        createdAt: g.createdAt.toISOString(),
      };
    })
  );

  return NextResponse.json(withProgress);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json();
  const { exerciseId, exerciseName, targetWeight, targetDate } = body;
  if (!exerciseId || !targetWeight || !targetDate) return badRequest();

  const goal = await prisma.exerciseGoal.upsert({
    where: { userId_exerciseId: { userId: session.user.id, exerciseId } },
    create: {
      userId: session.user.id,
      exerciseId,
      exerciseName: exerciseName ?? exerciseId,
      targetWeight: Number(targetWeight),
      targetDate: new Date(targetDate),
    },
    update: {
      exerciseName: exerciseName ?? exerciseId,
      targetWeight: Number(targetWeight),
      targetDate: new Date(targetDate),
    },
  });

  return NextResponse.json({ id: goal.id });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get('exerciseId');
  if (!exerciseId) return badRequest('exerciseId required');

  await prisma.exerciseGoal.deleteMany({
    where: { userId: session.user.id, exerciseId },
  });

  return NextResponse.json({ ok: true });
}
