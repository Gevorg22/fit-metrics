import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workouts = await prisma.workout.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: 'desc' },
    include: { sets: true },
  });

  return NextResponse.json(workouts);
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workout = await prisma.workout.create({
    data: { userId: session.user.id },
  });

  return NextResponse.json(workout, { status: 201 });
}
