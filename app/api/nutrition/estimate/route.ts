import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI не настроен' }, { status: 503 });

  const body = await request.json();
  const { name, grams } = body ?? {};
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const portion = grams ? `${grams}г` : 'стандартная порция';
  const prompt = `Ты диетолог. Оцени КБЖУ для: "${name}", порция: ${portion}.
Верни ТОЛЬКО JSON без markdown, без пояснений:
{"calories":число,"protein":граммы,"fat":граммы,"carbs":граммы}
Только числа без единиц. Если порция не указана — используй стандартную порцию 100г или типичную порцию блюда.`;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.1,
    }),
  });

  if (!groqRes.ok) {
    return NextResponse.json({ error: 'Ошибка AI сервиса' }, { status: 502 });
  }

  const groqData = await groqRes.json();
  const text = groqData.choices?.[0]?.message?.content?.trim() ?? '';

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json({
      calories: Math.round(Number(parsed.calories ?? 0)),
      protein: Math.round(Number(parsed.protein ?? 0) * 10) / 10,
      fat: Math.round(Number(parsed.fat ?? 0) * 10) / 10,
      carbs: Math.round(Number(parsed.carbs ?? 0) * 10) / 10,
    });
  } catch {
    return NextResponse.json({ error: 'Не удалось получить данные' }, { status: 422 });
  }
}
