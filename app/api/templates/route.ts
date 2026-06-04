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

  return NextResponse.json(templates);
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
