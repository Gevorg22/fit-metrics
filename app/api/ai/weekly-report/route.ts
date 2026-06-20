import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { unauthorized } from '@/lib/api-response';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI не настроен' }, { status: 503 });

  const userId = session.user.id;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [weekWorkouts, totalWorkouts] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, startedAt: { gte: weekAgo }, finishedAt: { not: null } },
      orderBy: { startedAt: 'asc' },
      include: {
        sets: { select: { exerciseId: true, weight: true, reps: true } },
      },
    }),
    prisma.workout.count({ where: { userId } }),
  ]);

  const exerciseIds = [...new Set(weekWorkouts.flatMap((w) => w.sets.map((s) => s.exerciseId)))];
  const exercises = exerciseIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, nameRu: true, name: true, primaryMuscles: true },
      })
    : [];
  const exMap = Object.fromEntries(
    exercises.map((e) => [e.id, { name: e.nameRu ?? e.name, muscles: e.primaryMuscles }])
  );

  const muscleCount: Record<string, number> = {};
  for (const w of weekWorkouts) {
    for (const s of w.sets) {
      const muscles = exMap[s.exerciseId]?.muscles ?? [];
      for (const m of muscles) {
        muscleCount[m] = (muscleCount[m] ?? 0) + 1;
      }
    }
  }

  const totalVolume = weekWorkouts.reduce(
    (sum, w) => sum + w.sets.reduce((s2, s) => s2 + s.weight * s.reps, 0),
    0
  );

  const workoutsText =
    weekWorkouts.length === 0
      ? 'Не было тренировок на этой неделе.'
      : weekWorkouts
          .map((w) => {
            const date = new Date(w.startedAt).toLocaleDateString('ru', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            });
            const duration = w.finishedAt
              ? Math.round(
                  (new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000
                )
              : 0;
            return `${date}: ${w.sets.length} подходов, ${duration} мин`;
          })
          .join('\n');

  const musclesText = Object.entries(muscleCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([m, cnt]) => `${m}: ${cnt} подходов`)
    .join(', ');

  const prompt = `Ты персональный фитнес-тренер. Проанализируй тренировочную неделю пользователя и дай краткий отчёт.

Тренировок за 7 дней: ${weekWorkouts.length} (всего за всё время: ${totalWorkouts})
Объём за неделю: ${Math.round(totalVolume)} кг

Тренировки:
${workoutsText}

Нагружённые мышцы: ${musclesText || 'нет данных'}

Напиши отчёт на русском языке — 3 коротких абзаца:
1. Оценка недели (объём, регулярность)
2. Анализ мышц: что проработал хорошо, чего не хватало
3. Конкретная рекомендация на следующую неделю

Не используй markdown, звёздочки или символы форматирования. Пиши обычным текстом, каждый абзац с новой строки.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 450,
      temperature: 0.7,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Ошибка AI' }, { status: 502 });

  const data = await res.json();
  const report = data.choices?.[0]?.message?.content?.trim() ?? 'Не удалось создать отчёт.';

  return NextResponse.json({
    report,
    workoutsCount: weekWorkouts.length,
    totalVolume: Math.round(totalVolume),
  });
}
