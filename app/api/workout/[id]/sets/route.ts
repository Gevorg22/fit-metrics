import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workoutId } = await params;
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout || workout.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { exerciseId, setNumber, weight, reps } = await req.json();
  if (!exerciseId || !setNumber || !weight || !reps) {
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
  }

  const set = await prisma.workoutSet.create({
    data: { workoutId, exerciseId, setNumber, weight, reps },
  });

  return NextResponse.json(set, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workoutId } = await params;
  const { setId } = await req.json();

  const set = await prisma.workoutSet.findUnique({
    where: { id: setId },
    include: { workout: true },
  });
  if (!set || set.workout.userId !== session.user.id || set.workoutId !== workoutId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.workoutSet.delete({ where: { id: setId } });
  return new NextResponse(null, { status: 204 });
}
