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
        exerciseImages={{}}
        weightHistory={[]}
        personalRecords={[]}
        isGuest
      />
    );
  }

  const userId = session!.user!.id!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weightLog, totalWorkouts, lastWorkout, recentWorkouts, weightHistory, prRaw] = await Promise.all([
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
      take: 5,
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
    prisma.workoutSet.groupBy({
      by: ['exerciseId'],
      where: { workout: { userId } },
      _max: { weight: true, reps: true },
      orderBy: { _max: { weight: 'desc' } },
      take: 6,
    }),
  ]);

  const allExerciseIds = [
    ...new Set([
      ...recentWorkouts.flatMap((w) => w.sets.map((s) => s.exerciseId)),
      ...prRaw.map((r) => r.exerciseId),
    ]),
  ];
  const exercises = allExerciseIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: allExerciseIds } },
        select: { id: true, name: true, nameRu: true, images: true },
      })
    : [];
  const exerciseNames: Record<string, string> = Object.fromEntries(
    exercises.map((e) => [e.id, e.nameRu ?? e.name])
  );
  const exerciseImages: Record<string, string> = Object.fromEntries(
    exercises.filter((e) => e.images[0]).map((e) => [e.id, e.images[0]])
  );

  const personalRecords = prRaw
    .filter((r) => r._max.weight !== null)
    .map((r) => ({
      exerciseId: r.exerciseId,
      exerciseName: exerciseNames[r.exerciseId] ?? r.exerciseId,
      maxWeight: r._max.weight!,
      maxReps: r._max.reps ?? null,
    }));

  return (
    <DashboardView
      todayWeight={weightLog?.weight ?? null}
      totalWorkouts={totalWorkouts}
      lastWorkoutDate={lastWorkout?.startedAt.toISOString() ?? null}
      exerciseNames={exerciseNames}
      exerciseImages={exerciseImages}
      personalRecords={personalRecords}
      weightHistory={weightHistory.map((w) => ({
        id: w.id,
        weight: w.weight,
        date: w.date.toISOString(),
      }))}
      recentWorkouts={recentWorkouts.map((w) => ({
        id: w.id,
        startedAt: w.startedAt.toISOString(),
        finishedAt: w.finishedAt?.toISOString() ?? null,
        notes: w.notes ?? null,
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
