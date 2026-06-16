import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function displayName(name: string | null, email: string): string {
  return name?.trim() || maskEmail(email);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      workouts: {
        where: { finishedAt: { not: null } },
        select: {
          id: true,
          startedAt: true,
          finishedAt: true,
          sets: { select: { weight: true, reps: true } },
        },
      },
    },
  });

  const rows = users.map((u) => {
    const finishedWorkouts = u.workouts;
    const allSets = finishedWorkouts.flatMap((w) => w.sets);
    const totalVolume = Math.round(allSets.reduce((s, x) => s + x.weight * x.reps, 0));
    const maxWeight = allSets.length > 0 ? Math.max(...allSets.map((s) => s.weight)) : 0;
    const workoutCount = finishedWorkouts.length;

    return {
      userId: u.id,
      displayName: displayName(u.name, u.email),
      isMe: u.id === session.user!.id,
      totalVolume,
      maxWeight,
      workoutCount,
    };
  }).filter((r) => r.workoutCount > 0);

  const byVolume = [...rows].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 10);
  const byWorkouts = [...rows].sort((a, b) => b.workoutCount - a.workoutCount).slice(0, 10);
  const byMaxWeight = [...rows].sort((a, b) => b.maxWeight - a.maxWeight).slice(0, 10);

  return NextResponse.json({ byVolume, byWorkouts, byMaxWeight });
}
