import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default async function DashboardPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const isGuest = cookieStore.get('fitmetrics-guest')?.value === '1';

  if (!session?.user?.id && !isGuest) redirect('/login');

  if (isGuest && !session?.user?.id) {
    return (
      <DashboardView
        todayWeight={null}
        totalWorkouts={0}
        lastWorkoutDate={null}
        recentWorkouts={[]}
        exerciseNames={{}}
        weightHistory={[]}
        isGuest
      />
    );
  }

  const userId = session!.user!.id!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weightLog, totalWorkouts, lastWorkout, recentWorkouts, weightHistory] = await Promise.all([
    prisma.weightLog.findUnique({
      where: { userId_date: { userId, date: today } },
    }),
    prisma.workout.count({ where: { userId } }),
    prisma.workout.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    }),
    prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        sets: {
          orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
        },
      },
    }),
    prisma.weightLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { id: true, weight: true, date: true },
    }),
  ]);

  const exerciseIds = [
    ...new Set(recentWorkouts.flatMap((w) => w.sets.map((s) => s.exerciseId))),
  ];
  const exercises = exerciseIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, name: true, nameRu: true },
      })
    : [];
  const exerciseNames: Record<string, string> = Object.fromEntries(
    exercises.map((e) => [e.id, e.nameRu ?? e.name])
  );

  return (
    <DashboardView
      todayWeight={weightLog?.weight ?? null}
      totalWorkouts={totalWorkouts}
      lastWorkoutDate={lastWorkout?.startedAt.toISOString() ?? null}
      exerciseNames={exerciseNames}
      weightHistory={weightHistory.map((w) => ({
        id: w.id,
        weight: w.weight,
        date: w.date.toISOString(),
      }))}
      recentWorkouts={recentWorkouts.map((w) => ({
        id: w.id,
        startedAt: w.startedAt.toISOString(),
        finishedAt: w.finishedAt?.toISOString() ?? null,
        sets: w.sets.map((s) => ({
          id: s.id,
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
        })),
      }))}
    />
  );
}
