import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workoutId, setId } = await params;
  const { weight, reps } = await req.json();

  if (!weight || !reps) {
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
  }

  const set = await prisma.workoutSet.findUnique({
    where: { id: setId },
    include: { workout: true },
  });

  if (!set || set.workout.userId !== session.user.id || set.workoutId !== workoutId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.workoutSet.update({
    where: { id: setId },
    data: { weight, reps },
  });

  return NextResponse.json(updated);
}
