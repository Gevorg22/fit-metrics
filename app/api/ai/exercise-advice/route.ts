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

  let prompt: string;

  if (workouts.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gender: true, heightCm: true, goalWeight: true, birthDate: true },
    });

    const latestWeight = await prisma.weightLog.findFirst({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      select: { weight: true },
    });

    const age = user?.birthDate
      ? (() => {
          const birth = new Date(user.birthDate);
          const today = new Date();
          let a = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
          return a;
        })()
      : null;

    const profileParts: string[] = [];
    if (user?.gender) profileParts.push(user.gender === 'male' ? 'мужчина' : 'женщина');
    if (age) profileParts.push(`${age} лет`);
    if (user?.heightCm) profileParts.push(`рост ${user.heightCm} см`);
    if (latestWeight?.weight) profileParts.push(`вес ${latestWeight.weight} кг`);
    const profileStr = profileParts.length > 0 ? profileParts.join(', ') : 'данные профиля не указаны';

    prompt = `Ты персональный тренер. Пользователь впервые выполняет упражнение "${exerciseName}" и никогда раньше его не делал.

Данные пользователя: ${profileStr}.

Дай конкретный совет с чего начать (2-4 предложения) на русском языке: какой стартовый вес и сколько повторений попробовать, сколько подходов рекомендуешь, почему именно такие цифры. Если данных профиля мало — используй типичные рекомендации для новичка. Не используй markdown-форматирование.`;
  } else {
    const historyLines = workouts
      .slice()
      .reverse()
      .map((w, i) => {
        const date = new Date(w.startedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
        const setsStr = w.sets.map((s) => `${s.weight}кг×${s.reps}`).join(', ');
        return `Тренировка ${i + 1} (${date}): ${setsStr}`;
      })
      .join('\n');

    prompt = `Ты персональный тренер. Проанализируй историю упражнения "${exerciseName}" за последние тренировки и дай конкретный совет на следующую тренировку.

История (от старых к новым):
${historyLines}

Дай короткий совет (2-4 предложения) на русском языке: какой вес и сколько повторений попробовать в следующий раз, и почему. Будь конкретным — называй точные цифры. Не используй markdown-форматирование.`;
  }

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
