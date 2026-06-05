import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = await prisma.favoriteExercise.findMany({
    where: { userId: session.user.id },
    select: { exerciseId: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(favorites.map((f) => f.exerciseId));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { exerciseId } = (await req.json()) as { exerciseId: string };
  if (!exerciseId) {
    return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });
  }

  await prisma.favoriteExercise.upsert({
    where: { userId_exerciseId: { userId: session.user.id, exerciseId } },
    create: { userId: session.user.id, exerciseId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { exerciseId } = (await req.json()) as { exerciseId: string };
  if (!exerciseId) {
    return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });
  }

  await prisma.favoriteExercise.deleteMany({
    where: { userId: session.user.id, exerciseId },
  });

  return NextResponse.json({ ok: true });
}
