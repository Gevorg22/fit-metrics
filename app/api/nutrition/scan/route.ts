import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
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

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }),
    }
  );

  if (!geminiRes.ok) {
    return NextResponse.json({ error: 'Ошибка AI сервиса' }, { status: 502 });
  }

  const geminiData = await geminiRes.json();
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

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
