import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ProfileView } from '@/components/profile/ProfileView';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  const [user, workouts, sets, topExercisesRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, notificationsEnabled: true, gender: true, heightCm: true, goalWeight: true, birthDate: true, image: true },
    }),
    prisma.workout.findMany({
      where: { userId },
      select: { startedAt: true, finishedAt: true },
    }),
    prisma.workoutSet.findMany({
      where: { workout: { userId } },
      select: { weight: true, reps: true },
    }),
    prisma.workoutSet.groupBy({
      by: ['exerciseId'],
      where: { workout: { userId } },
      _count: { _all: true },
      orderBy: { _count: { exerciseId: 'desc' } },
      take: 5,
    }),
  ]);

  const totalWorkouts = workouts.length;
  const totalVolume = Math.round(sets.reduce((acc, s) => acc + s.weight * s.reps, 0));

  const durationsMs = workouts
    .filter((w) => w.finishedAt)
    .map((w) => new Date(w.finishedAt!).getTime() - new Date(w.startedAt).getTime());
  const avgDurationMin = durationsMs.length
    ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length / 60000)
    : 0;

  const topIds = topExercisesRaw.map((r) => r.exerciseId);
  const exercises = topIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: topIds } },
        select: { id: true, name: true, nameRu: true },
      })
    : [];
  const nameMap = Object.fromEntries(exercises.map((e) => [e.id, e.nameRu ?? e.name]));

  const topExercises = topExercisesRaw.map((r) => ({
    exerciseId: r.exerciseId,
    name: nameMap[r.exerciseId] ?? r.exerciseId,
    count: r._count._all,
  }));

  return (
    <ProfileView
      email={session.user.email ?? ''}
      name={user?.name ?? ''}
      notificationsEnabled={user?.notificationsEnabled ?? false}
      gender={user?.gender ?? null}
      heightCm={user?.heightCm ?? null}
      goalWeight={user?.goalWeight ?? null}
      birthDate={user?.birthDate ? user.birthDate.toISOString().slice(0, 10) : null}
      image={user?.image ?? null}
      totalWorkouts={totalWorkouts}
      totalVolume={totalVolume}
      avgDurationMin={avgDurationMin}
      topExercises={topExercises}
    />
  );
}
