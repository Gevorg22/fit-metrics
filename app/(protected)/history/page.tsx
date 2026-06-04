import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { HistoryList } from '@/components/history/HistoryList';
import styles from './page.module.scss';

const PAGE_SIZE = 15;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [total, workouts] = await Promise.all([
    prisma.workout.count({ where: { userId } }),
    prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        sets: {
          orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
        },
      },
    }),
  ]);

  const allExerciseIds = [...new Set(workouts.flatMap((w) => w.sets.map((s) => s.exerciseId)))];
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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>История тренировок</h1>
          <span className={styles.total}>{total} тренировок</span>
        </div>
        <a href="/api/export" className={styles.exportBtn} download>
          ⬇ Экспорт CSV
        </a>
      </div>

      <HistoryList
        workouts={workouts.map((w) => ({
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
        page={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}
