import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(exercises);
  } catch (e) {
    console.error('[/api/exercises] error:', e);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}
