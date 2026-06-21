import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const [user, workouts, sets, topExercisesRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, notificationsEnabled: true, gender: true, heightCm: true, goalWeight: true, birthDate: true, image: true, fitnessLevel: true, weeklyGoal: true },
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
  const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);

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
        select: { id: true, name: true, nameRu: true, images: true },
      })
    : [];
  const nameMap = Object.fromEntries(exercises.map((e) => [e.id, e.nameRu ?? e.name]));
  const imageMap = Object.fromEntries(exercises.map((e) => [e.id, (e.images as string[])[0] ?? null]));

  const topExercises = topExercisesRaw.map((r) => ({
    exerciseId: r.exerciseId,
    name: nameMap[r.exerciseId] ?? r.exerciseId,
    count: r._count._all,
    image: imageMap[r.exerciseId] ?? null,
  }));

  return NextResponse.json({
    totalWorkouts,
    totalVolume: Math.round(totalVolume),
    avgDurationMin,
    topExercises,
    email: session.user.email ?? '',
    name: user?.name ?? '',
    notificationsEnabled: user?.notificationsEnabled ?? false,
    gender: user?.gender ?? null,
    heightCm: user?.heightCm ?? null,
    goalWeight: user?.goalWeight ?? null,
    birthDate: user?.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
    image: user?.image ?? null,
    fitnessLevel: user?.fitnessLevel ?? null,
    weeklyGoal: user?.weeklyGoal ?? null,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const data: {
    name?: string | null;
    notificationsEnabled?: boolean;
    gender?: string | null;
    heightCm?: number | null;
    goalWeight?: number | null;
    birthDate?: Date | null;
    image?: string | null;
    fitnessLevel?: string | null;
    weeklyGoal?: number | null;
  } = {};

  if (typeof body.name === 'string') data.name = body.name.trim() || null;
  if (typeof body.notificationsEnabled === 'boolean') data.notificationsEnabled = body.notificationsEnabled;
  if (body.gender !== undefined) data.gender = body.gender === 'male' || body.gender === 'female' ? body.gender : null;
  if (body.heightCm !== undefined) data.heightCm = body.heightCm ? Number(body.heightCm) || null : null;
  if (body.goalWeight !== undefined) data.goalWeight = body.goalWeight ? Number(body.goalWeight) || null : null;
  if (body.birthDate !== undefined) data.birthDate = body.birthDate ? new Date(body.birthDate) : null;
  if (body.fitnessLevel !== undefined) {
    const valid = ['beginner', 'intermediate', 'advanced'];
    data.fitnessLevel = valid.includes(body.fitnessLevel) ? body.fitnessLevel : null;
  }
  if (body.weeklyGoal !== undefined) data.weeklyGoal = body.weeklyGoal ? Math.min(7, Math.max(1, Number(body.weeklyGoal))) : null;
  if (body.image !== undefined) {
    if (body.image === null) {
      data.image = null;
    } else if (typeof body.image === 'string' && body.image.startsWith('data:image/')) {
      data.image = body.image;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { name: true, notificationsEnabled: true, gender: true, heightCm: true, goalWeight: true, birthDate: true, fitnessLevel: true, weeklyGoal: true },
  });

  return NextResponse.json(updated);
}
