import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string) {
  return (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workouts = await prisma.workout.findMany({
    where: { userId: session.user.id },
    select: { startedAt: true },
    orderBy: { startedAt: 'desc' },
  });

  if (!workouts.length) {
    return NextResponse.json({ current: 0, longest: 0, lastWorkoutDate: null });
  }

  const dates = [...new Set(workouts.map((w) => toDateStr(w.startedAt)))];

  const todayStr = toDateStr(new Date());
  const yesterdayStr = toDateStr(new Date(Date.now() - 86_400_000));

  let current = 0;
  if (dates[0] === todayStr || dates[0] === yesterdayStr) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      if (diffDays(dates[i - 1], dates[i]) === 1) current++;
      else break;
    }
  }

  let longest = current;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (diffDays(dates[i - 1], dates[i]) === 1) run++;
    else { longest = Math.max(longest, run); run = 1; }
  }
  longest = Math.max(longest, run);

  return NextResponse.json({ current, longest, lastWorkoutDate: dates[0] });
}
