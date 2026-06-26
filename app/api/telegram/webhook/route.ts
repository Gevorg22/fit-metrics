import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const APP_URL = 'https://fit-metrics-xi.vercel.app';
const MINI_APP_URL = 'https://t.me/fitmetrics_app_bot/fitmetrics';

async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

function openAppButton() {
  return {
    inline_keyboard: [[{ text: '💪 Открыть fitMetrics', web_app: { url: APP_URL } }]],
  };
}

export async function POST(req: NextRequest) {
  const update = await req.json();
  const msg = update.message;
  const text: string = msg?.text ?? '';
  const chatId: number = msg?.chat?.id;
  const from = msg?.from;

  // ── /start (with login token) ────────────────────────────────────────────
  if (text.startsWith('/start login_')) {
    const token = text.slice('/start login_'.length).trim();
    const record = await prisma.telegramLoginToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      await sendMessage(chatId, '❌ Ссылка для входа устарела. Попробуй снова.');
      return NextResponse.json({ ok: true });
    }
    await sendMessage(chatId, `👋 Привет, <b>${from.first_name}</b>!\n\nПодтверди вход в fitMetrics:`, {
      inline_keyboard: [[{ text: '✅ Подтвердить вход', callback_data: `confirm_${token}` }]],
    });
    return NextResponse.json({ ok: true });
  }

  // ── /start ───────────────────────────────────────────────────────────────
  if (text === '/start') {
    await sendMessage(
      chatId,
      `👋 Привет, <b>${from?.first_name ?? 'спортсмен'}</b>!\n\n` +
      `💪 <b>fitMetrics</b> — твой личный дневник тренировок и питания.\n\n` +
      `<b>Что умею:</b>\n` +
      `📊 /stats — полная статистика\n` +
      `🏋️ /today — последняя тренировка\n` +
      `⚖️ /weight 75.5 — записать вес\n\n` +
      `Открой приложение и начни тренироваться 👇`,
      {
        inline_keyboard: [
          [{ text: '💪 Открыть fitMetrics', web_app: { url: APP_URL } }],
          [{ text: '🌐 Веб-версия', url: APP_URL }],
        ],
      }
    );
    return NextResponse.json({ ok: true });
  }

  // ── /stats ───────────────────────────────────────────────────────────────
  if (text === '/stats') {
    const telegramId = String(from?.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await sendMessage(chatId, '❌ Аккаунт не найден. Сначала войди в приложение.', openAppButton());
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalWorkouts, weekWorkouts, monthWorkouts, totalSets, lastWeight, bestSet] =
      await Promise.all([
        prisma.workout.count({ where: { userId: user.id, finishedAt: { not: null } } }),
        prisma.workout.count({ where: { userId: user.id, startedAt: { gte: weekAgo }, finishedAt: { not: null } } }),
        prisma.workout.count({ where: { userId: user.id, startedAt: { gte: monthAgo }, finishedAt: { not: null } } }),
        prisma.workoutSet.count({ where: { workout: { userId: user.id } } }),
        prisma.weightLog.findFirst({ where: { userId: user.id }, orderBy: { date: 'desc' } }),
        prisma.workoutSet.findFirst({
          where: { workout: { userId: user.id } },
          orderBy: { weight: 'desc' },
        }),
      ]);

    // Streak
    const workoutDays = await prisma.workout.findMany({
      where: { userId: user.id, finishedAt: { not: null } },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
    });
    let streak = 0;
    const seen = new Set<string>();
    for (const w of workoutDays) {
      const d = w.startedAt.toISOString().slice(0, 10);
      seen.add(d);
    }
    let check = new Date(todayStart);
    while (seen.has(check.toISOString().slice(0, 10))) {
      streak++;
      check = new Date(check.getTime() - 24 * 60 * 60 * 1000);
    }

    // Volume
    const sets = await prisma.workoutSet.findMany({
      where: { workout: { userId: user.id } },
      select: { weight: true, reps: true },
    });
    const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);

    const weightStr = lastWeight ? `⚖️ Последний вес: <b>${lastWeight.weight} кг</b>\n` : '';
    const bestStr = bestSet ? `🏆 Макс. вес на снаряде: <b>${bestSet.weight} кг</b>\n` : '';

    await sendMessage(
      chatId,
      `📊 <b>Статистика ${user.name ?? from?.first_name ?? ''}</b>\n\n` +
      `🏋️ Всего тренировок: <b>${totalWorkouts}</b>\n` +
      `📅 За неделю: <b>${weekWorkouts}</b>\n` +
      `📆 За месяц: <b>${monthWorkouts}</b>\n` +
      `🔢 Всего подходов: <b>${totalSets}</b>\n` +
      `🔥 Стрик: <b>${streak} дн.</b>\n` +
      `💪 Суммарный объём: <b>${Math.round(totalVolume).toLocaleString('ru')} кг</b>\n` +
      weightStr +
      bestStr,
      openAppButton()
    );
    return NextResponse.json({ ok: true });
  }

  // ── /today ───────────────────────────────────────────────────────────────
  if (text === '/today') {
    const telegramId = String(from?.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await sendMessage(chatId, '❌ Аккаунт не найден. Сначала войди в приложение.', openAppButton());
      return NextResponse.json({ ok: true });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const lastWorkout = await prisma.workout.findFirst({
      where: { userId: user.id, finishedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      include: { sets: true },
    });

    if (!lastWorkout) {
      await sendMessage(chatId, '🏃 Тренировок пока нет. Самое время начать!', openAppButton());
      return NextResponse.json({ ok: true });
    }

    const isToday = lastWorkout.startedAt >= todayStart;
    const dateStr = isToday
      ? 'сегодня'
      : lastWorkout.startedAt.toLocaleDateString('ru', { day: 'numeric', month: 'long' });

    const durationMin = lastWorkout.finishedAt
      ? Math.round((lastWorkout.finishedAt.getTime() - lastWorkout.startedAt.getTime()) / 60000)
      : null;

    const volume = lastWorkout.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
    const exerciseCount = new Set(lastWorkout.sets.map((s) => s.exerciseId)).size;

    await sendMessage(
      chatId,
      (isToday ? '✅ <b>Сегодняшняя тренировка</b>' : `📅 <b>Последняя тренировка</b> (${dateStr})`) + '\n\n' +
      `🏋️ Упражнений: <b>${exerciseCount}</b>\n` +
      `🔢 Подходов: <b>${lastWorkout.sets.length}</b>\n` +
      `💪 Объём: <b>${Math.round(volume).toLocaleString('ru')} кг</b>\n` +
      (durationMin ? `⏱ Длительность: <b>${durationMin} мин.</b>\n` : '') +
      (lastWorkout.notes ? `📝 Заметка: ${lastWorkout.notes}\n` : '') +
      (isToday ? '' : '\n🔥 Не забудь потренироваться сегодня!'),
      openAppButton()
    );
    return NextResponse.json({ ok: true });
  }

  // ── /weight ──────────────────────────────────────────────────────────────
  if (text.startsWith('/weight')) {
    const telegramId = String(from?.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await sendMessage(chatId, '❌ Аккаунт не найден. Сначала войди в приложение.', openAppButton());
      return NextResponse.json({ ok: true });
    }

    const parts = text.split(' ');
    const value = Number.parseFloat(parts[1] ?? '');

    if (Number.isNaN(value) || value < 20 || value > 300) {
      await sendMessage(chatId, '⚖️ Укажи вес в кг. Пример:\n<code>/weight 75.5</code>');
      return NextResponse.json({ ok: true });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.weightLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: { userId: user.id, weight: value, date: today },
      update: { weight: value },
    });

    const prev = await prisma.weightLog.findFirst({
      where: { userId: user.id, date: { lt: today } },
      orderBy: { date: 'desc' },
    });

    let diff = '';
    if (prev) {
      const delta = value - prev.weight;
      diff = delta > 0 ? ` (+${delta.toFixed(1)} кг)` : ` (${delta.toFixed(1)} кг)`;
    }

    await sendMessage(chatId, `✅ Вес <b>${value} кг</b>${diff} записан на сегодня!`, openAppButton());
    return NextResponse.json({ ok: true });
  }

  // ── confirm login callback ───────────────────────────────────────────────
  if (update.callback_query?.data?.startsWith('confirm_')) {
    const token = update.callback_query.data.slice('confirm_'.length);
    const cbFrom = update.callback_query.from;

    const record = await prisma.telegramLoginToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      await answerCallback(update.callback_query.id, '❌ Ссылка устарела');
      return NextResponse.json({ ok: true });
    }

    await prisma.telegramLoginToken.update({
      where: { token },
      data: {
        confirmed: true,
        userData: {
          id: cbFrom.id,
          first_name: cbFrom.first_name,
          last_name: cbFrom.last_name ?? null,
          username: cbFrom.username ?? null,
          photo_url: null,
        },
      },
    });

    await answerCallback(update.callback_query.id, '✅ Вход подтверждён!');
    return NextResponse.json({ ok: true });
  }

  // ── default ──────────────────────────────────────────────────────────────
  if (chatId && text && !text.startsWith('/')) {
    await sendMessage(
      chatId,
      `💪 Для подробностей открой приложение.\n\n` +
      `Доступные команды:\n` +
      `📊 /stats — статистика\n` +
      `🏋️ /today — последняя тренировка\n` +
      `⚖️ /weight 75.5 — записать вес`,
      openAppButton()
    );
  }

  return NextResponse.json({ ok: true });
}
