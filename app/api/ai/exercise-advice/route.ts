import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get('exerciseId');
  const exerciseName = searchParams.get('exerciseName') ?? 'упражнение';
  if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI не настроен' }, { status: 503 });

  const workouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
      finishedAt: { not: null },
      sets: { some: { exerciseId } },
    },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: {
      startedAt: true,
      sets: {
        where: { exerciseId },
        select: { weight: true, reps: true, setNumber: true },
        orderBy: { setNumber: 'asc' },
      },
    },
  });

  if (workouts.length === 0) {
    return NextResponse.json({ advice: 'Пока нет истории по этому упражнению. Запиши хотя бы одну тренировку — тогда смогу дать совет.' });
  }

  const historyLines = workouts
    .slice()
    .reverse()
    .map((w, i) => {
      const date = new Date(w.startedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
      const setsStr = w.sets.map((s) => `${s.weight}кг×${s.reps}`).join(', ');
      return `Тренировка ${i + 1} (${date}): ${setsStr}`;
    })
    .join('\n');

  const prompt = `Ты персональный тренер. Проанализируй историю упражнения "${exerciseName}" за последние тренировки и дай конкретный совет на следующую тренировку.

История (от старых к новым):
${historyLines}

Дай короткий совет (2-4 предложения) на русском языке: какой вес и сколько повторений попробовать в следующий раз, и почему. Будь конкретным — называй точные цифры. Не используй markdown-форматирование.`;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!groqRes.ok) {
    return NextResponse.json({ error: 'Ошибка AI сервиса' }, { status: 502 });
  }

  const groqData = await groqRes.json();
  const advice = groqData.choices?.[0]?.message?.content?.trim() ?? 'Не удалось получить совет.';

  return NextResponse.json({ advice });
}
