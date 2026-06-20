import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, exercises: true, createdAt: true },
  });

  const allIds = [...new Set(
    templates.flatMap((t) => (t.exercises as { exerciseId: string }[]).map((e) => e.exerciseId))
  )];
  const exerciseRows = allIds.length
    ? await prisma.exercise.findMany({ where: { id: { in: allIds } }, select: { id: true, images: true } })
    : [];
  const imgMap = Object.fromEntries(exerciseRows.map((e) => [e.id, (e.images as string[])[0] ?? null]));

  const enriched = templates.map((t) => ({
    ...t,
    exercises: (t.exercises as { exerciseId: string; exerciseName: string }[]).map((e) => ({
      ...e,
      exerciseImage: imgMap[e.exerciseId] ?? null,
    })),
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, exercises } = body as { name: string; exercises: unknown };

  if (!name?.trim() || !Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const template = await prisma.workoutTemplate.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      exercises,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
