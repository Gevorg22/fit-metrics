import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

  const entries = await prisma.foodEntry.findMany({
    where: {
      userId: session.user.id,
      date: new Date(date),
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, calories: true, protein: true, fat: true, carbs: true, createdAt: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { gender: true, heightCm: true, goalWeight: true, birthDate: true },
  });

  const latestWeight = await prisma.weightLog.findFirst({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    select: { weight: true },
  });

  return NextResponse.json({ entries, user, latestWeight: latestWeight?.weight ?? null });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, calories, protein, fat, carbs, date } = body;

  if (!name || calories == null) {
    return NextResponse.json({ error: 'name and calories required' }, { status: 400 });
  }

  const entry = await prisma.foodEntry.create({
    data: {
      userId: session.user.id,
      date: new Date(date ?? new Date().toISOString().slice(0, 10)),
      name: String(name),
      calories: Math.round(Number(calories)),
      protein: Number(protein ?? 0),
      fat: Number(fat ?? 0),
      carbs: Number(carbs ?? 0),
    },
  });

  return NextResponse.json(entry);
}
