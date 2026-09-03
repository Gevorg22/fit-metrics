import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function displayName(name: string | null, email: string | null): string {
  return name?.trim() || (email ? maskEmail(email) : 'Пользователь');
}

interface AggregateRow {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  workoutCount: number;
  totalVolume: number;
  maxWeight: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  /**
   * Раньше здесь грузились все пользователи со всеми завершёнными тренировками
   * и всеми подходами внутри, а объём и максимальный вес считались на JS —
   * то есть в память поднималась вся таблица подходов ради топ-10.
   * Теперь агрегация целиком на стороне Postgres, наружу выходит по строке на юзера.
   */
  const rows = await prisma.$queryRaw<AggregateRow[]>`
    SELECT
      u.id,
      u.name,
      u.email,
      u.image,
      COUNT(DISTINCT w.id)::int                   AS "workoutCount",
      COALESCE(SUM(s.weight * s.reps), 0)::float8 AS "totalVolume",
      COALESCE(MAX(s.weight), 0)::float8          AS "maxWeight"
    FROM "User" u
    JOIN "Workout" w ON w."userId" = u.id AND w."finishedAt" IS NOT NULL
    LEFT JOIN "WorkoutSet" s ON s."workoutId" = w.id
    GROUP BY u.id, u.name, u.email, u.image
  `;

  const entries = rows.map((r) => ({
    userId: r.id,
    displayName: displayName(r.name, r.email),
    image: r.image ?? null,
    isMe: r.id === session.user!.id,
    totalVolume: Math.round(r.totalVolume),
    maxWeight: r.maxWeight,
    workoutCount: r.workoutCount,
  }));

  const byVolume = [...entries].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 10);
  const byWorkouts = [...entries].sort((a, b) => b.workoutCount - a.workoutCount).slice(0, 10);
  const byMaxWeight = [...entries].sort((a, b) => b.maxWeight - a.maxWeight).slice(0, 10);

  return NextResponse.json(
    { byVolume, byWorkouts, byMaxWeight },
    { headers: { 'Cache-Control': 'private, max-age=120' } }
  );
}
