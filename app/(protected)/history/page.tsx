import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { HistoryList } from '@/components/history/HistoryList';
import { HistoryFilter } from '@/components/history/HistoryFilter';
import styles from './page.module.scss';

const PAGE_SIZE = 15;

interface Props {
  searchParams: Promise<{ cursor?: string; exerciseId?: string }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const { cursor, exerciseId } = await searchParams;

  const where = exerciseId
    ? { userId, sets: { some: { exerciseId } } }
    : { userId };

  const [total, workouts, allUsedExercises] = await Promise.all([
    cursor ? Promise.resolve(null) : prisma.workout.count({ where: { userId } }),
    prisma.workout.findMany({
      where,
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sets: { orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }] },
      },
    }),
    prisma.workoutSet.findMany({
      where: { workout: { userId } },
      select: { exerciseId: true },
      distinct: ['exerciseId'],
    }),
  ]);

  const hasMore = workouts.length > PAGE_SIZE;
  const items = hasMore ? workouts.slice(0, PAGE_SIZE) : workouts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const allExerciseIds = [...new Set([
    ...items.flatMap((w) => w.sets.map((s) => s.exerciseId)),
    ...allUsedExercises.map((s) => s.exerciseId),
  ])];

  const exercises = allExerciseIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: allExerciseIds } },
        select: { id: true, name: true, nameRu: true, images: true },
        orderBy: { nameRu: 'asc' },
      })
    : [];

  const exerciseNames: Record<string, string> = Object.fromEntries(
    exercises.map((e) => [e.id, e.nameRu ?? e.name])
  );
  const exerciseImages: Record<string, string> = Object.fromEntries(
    exercises.filter((e) => e.images[0]).map((e) => [e.id, e.images[0]])
  );

  const filterOptions = exercises
    .filter((e) => allUsedExercises.some((u) => u.exerciseId === e.id))
    .map((e) => ({ id: e.id, name: e.nameRu ?? e.name }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>История тренировок</h1>
          {total !== null && (
            <span className={styles.total}>{total} тренировок</span>
          )}
        </div>
        <a href="/api/export" className={styles.exportBtn} download>
          ⬇ Экспорт CSV
        </a>
      </div>

      <Suspense>
        <HistoryFilter
          exercises={filterOptions}
          currentExerciseId={exerciseId ?? null}
        />
      </Suspense>

      <HistoryList
        workouts={items.map((w) => ({
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
        exerciseNames={exerciseNames}
        exerciseImages={exerciseImages}
        nextCursor={nextCursor}
        exerciseId={exerciseId ?? null}
      />
    </div>
  );
}
