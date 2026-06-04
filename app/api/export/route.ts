import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    include: {
      sets: {
        orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
      },
    },
  });

  const allExerciseIds = [...new Set(workouts.flatMap((w) => w.sets.map((s) => s.exerciseId)))];
  const exercises = allExerciseIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: allExerciseIds } },
        select: { id: true, name: true, nameRu: true },
      })
    : [];
  const nameMap: Record<string, string> = Object.fromEntries(
    exercises.map((e) => [e.id, e.nameRu ?? e.name])
  );

  const rows: string[] = [
    'Дата,Время начала,Продолжительность (мин),Упражнение,Подход,Вес (кг),Повторения,Заметка',
  ];

  for (const w of workouts) {
    const dateStr = new Date(w.startedAt).toLocaleDateString('ru');
    const timeStr = new Date(w.startedAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    const duration = w.finishedAt
      ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000)
      : '';
    const note = (w.notes ?? '').replace(/"/g, '""');

    if (w.sets.length === 0) {
      rows.push(`"${dateStr}","${timeStr}","${duration}","","","","","${note}"`);
    } else {
      for (const s of w.sets) {
        const exName = (nameMap[s.exerciseId] ?? s.exerciseId).replace(/"/g, '""');
        rows.push(`"${dateStr}","${timeStr}","${duration}","${exName}","${s.setNumber}","${s.weight}","${s.reps}","${note}"`);
      }
    }
  }

  const csv = '\uFEFF' + rows.join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fitmetrics-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
