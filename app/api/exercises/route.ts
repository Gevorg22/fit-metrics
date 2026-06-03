import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: { nameRu: 'asc' },
      select: {
        id: true,
        name: true,
        nameRu: true,
        primaryMuscles: true,
        images: true,
      },
    });

    return NextResponse.json(exercises, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (e) {
    console.error('[/api/exercises] error:', e);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}
