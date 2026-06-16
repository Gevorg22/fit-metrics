import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI не настроен' }, { status: 503 });

  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  if (!file) return NextResponse.json({ error: 'image required' }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = file.type || 'image/jpeg';

  const prompt = `Ты диетолог. Проанализируй фото еды и верни ТОЛЬКО JSON без markdown, без пояснений:
{"name":"название блюда на русском","calories":число,"protein":граммы,"fat":граммы,"carbs":граммы}

Оцени для одной порции на фото. Если несколько блюд — суммируй. Только числа без единиц измерения.`;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      }],
      max_tokens: 200,
      temperature: 0.1,
    }),
  });

  if (!groqRes.ok) {
    const errBody = await groqRes.json().catch(() => ({}));
    console.error('Groq vision error:', groqRes.status, JSON.stringify(errBody));
    const msg = errBody?.error?.message ?? 'Ошибка AI сервиса';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const groqData = await groqRes.json();
  const text = groqData.choices?.[0]?.message?.content?.trim() ?? '';

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json({
      name: String(parsed.name ?? 'Блюдо'),
      calories: Math.round(Number(parsed.calories ?? 0)),
      protein: Math.round(Number(parsed.protein ?? 0) * 10) / 10,
      fat: Math.round(Number(parsed.fat ?? 0) * 10) / 10,
      carbs: Math.round(Number(parsed.carbs ?? 0) * 10) / 10,
    });
  } catch {
    return NextResponse.json({ error: 'Не удалось распознать блюдо на фото' }, { status: 422 });
  }
}
