import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const APP_URL = 'https://fit-metrics-xi.vercel.app';

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
  return { inline_keyboard: [[{ text: '💪 Открыть fitMetrics', web_app: { url: APP_URL } }]] };
}

function calcStreak(workoutDays: { startedAt: Date }[]): number {
  const seen = new Set(workoutDays.map((w) => w.startedAt.toISOString().slice(0, 10)));
  let streak = 0;
  const check = new Date();
  check.setHours(0, 0, 0, 0);
  while (seen.has(check.toISOString().slice(0, 10))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

async function getUserOrReply(chatId: number, telegramId: string) {
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    await sendMessage(chatId, '❌ Аккаунт не найден. Сначала войди в приложение.', openAppButton());
  }
  return user;
}

const HELP_TEXT =
  `💪 <b>fitMetrics — команды бота</b>\n\n` +
  `<b>Личная статистика:</b>\n` +
  `📊 /stats — моя статистика\n` +
  `🏋️ /today — последняя тренировка\n` +
  `🏆 /records — личные рекорды\n` +
  `🔥 /streak — детали стрика\n` +
  `🎯 /goal — прогресс к цели по весу\n\n` +
  `<b>Общая статистика:</b>\n` +
  `🌍 /top — глобальный рейтинг пользователей\n\n` +
  `<b>Действия:</b>\n` +
  `⚖️ /weight 75.5 — записать вес\n\n` +
  `<b>Прочее:</b>\n` +
  `👨‍💻 /author — об авторе\n` +
  `❓ /help — это меню`;

export async function POST(req: NextRequest) {
  const update = await req.json();
  const msg = update.message;
  const text: string = msg?.text ?? '';
  const chatId: number = msg?.chat?.id;
  const from = msg?.from;

  // ── /start login_TOKEN ───────────────────────────────────────────────────
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
      `1323 упражнения с анимациями, AI-советник, рейтинг пользователей, дневник питания и многое другое.\n\n` +
      HELP_TEXT.split('\n').slice(2).join('\n') +
      `\nОткрой приложение и начни тренироваться 👇`,
      {
        inline_keyboard: [
          [{ text: '💪 Открыть fitMetrics', web_app: { url: APP_URL } }],
          [{ text: '🌐 Веб-версия', url: APP_URL }],
          [{ text: '❓ Все команды', callback_data: 'show_help' }],
        ],
      }
    );
    return NextResponse.json({ ok: true });
  }

  // ── /help ────────────────────────────────────────────────────────────────
  if (text === '/help') {
    await sendMessage(chatId, HELP_TEXT, openAppButton());
    return NextResponse.json({ ok: true });
  }

  // ── /author ──────────────────────────────────────────────────────────────
  if (text === '/author') {
    await sendMessage(
      chatId,
      `👨‍💻 <b>Об авторе</b>\n\n` +
      `Меня зовут <b>Геворг Карагозян</b>.\n\n` +
      `fitMetrics - мой личный pet-проект, созданный с нуля в свободное время. ` +
      `Идея, дизайн и полная разработка - всё моё.\n\n` +
      `<b>Стек:</b>\n` +
      `Next.js · TypeScript · PostgreSQL\n` +
      `Prisma · Ant Design · AI (Groq)\n\n` +
      `<b>Связаться:</b>\n` +
      `💬 @Gevorg1989\n` +
      `📧 gevorg227@gmail.com\n` +
      `💻 github.com/Gevorg22\n\n` +
      `⭐ Если нравится - поставь звезду на GitHub!`,
      {
        inline_keyboard: [
          [{ text: '💬 Написать автору', url: 'https://t.me/Gevorg1989' }],
          [{ text: '💻 GitHub проекта', url: 'https://github.com/Gevorg22/fit-metrics' }],
          [{ text: '💪 Открыть fitMetrics', web_app: { url: APP_URL } }],
        ],
      }
    );
    return NextResponse.json({ ok: true });
  }

  // ── /stats ───────────────────────────────────────────────────────────────
  if (text === '/stats') {
    const user = await getUserOrReply(chatId, String(from?.id));
    if (!user) return NextResponse.json({ ok: true });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalWorkouts, weekWorkouts, monthWorkouts, totalSets, lastWeight, bestSet, workoutDays, allSets] =
      await Promise.all([
        prisma.workout.count({ where: { userId: user.id, finishedAt: { not: null } } }),
        prisma.workout.count({ where: { userId: user.id, startedAt: { gte: weekAgo }, finishedAt: { not: null } } }),
        prisma.workout.count({ where: { userId: user.id, startedAt: { gte: monthAgo }, finishedAt: { not: null } } }),
        prisma.workoutSet.count({ where: { workout: { userId: user.id } } }),
        prisma.weightLog.findFirst({ where: { userId: user.id }, orderBy: { date: 'desc' } }),
        prisma.workoutSet.findFirst({ where: { workout: { userId: user.id } }, orderBy: { weight: 'desc' } }),
        prisma.workout.findMany({ where: { userId: user.id, finishedAt: { not: null } }, select: { startedAt: true } }),
        prisma.workoutSet.findMany({ where: { workout: { userId: user.id } }, select: { weight: true, reps: true } }),
      ]);

    const streak = calcStreak(workoutDays);
    const totalVolume = allSets.reduce((acc, s) => acc + s.weight * s.reps, 0);

    // Avg workout duration
    const workoutsWithDuration = await prisma.workout.findMany({
      where: { userId: user.id, finishedAt: { not: null } },
      select: { startedAt: true, finishedAt: true },
    });
    const avgMin = workoutsWithDuration.length
      ? Math.round(workoutsWithDuration.reduce((acc, w) => acc + (w.finishedAt!.getTime() - w.startedAt.getTime()), 0) / workoutsWithDuration.length / 60000)
      : 0;

    await sendMessage(
      chatId,
      `📊 <b>Моя статистика</b>\n\n` +
      `🏋️ Всего тренировок: <b>${totalWorkouts}</b>\n` +
      `📅 За неделю: <b>${weekWorkouts}</b>\n` +
      `📆 За месяц: <b>${monthWorkouts}</b>\n` +
      `🔢 Всего подходов: <b>${totalSets}</b>\n` +
      `⏱ Среднее время: <b>${avgMin} мин.</b>\n` +
      `🔥 Стрик: <b>${streak} дн.</b>\n` +
      `💪 Суммарный объём: <b>${Math.round(totalVolume).toLocaleString('ru')} кг</b>\n` +
      (lastWeight ? `⚖️ Последний вес: <b>${lastWeight.weight} кг</b>\n` : '') +
      (bestSet ? `🏆 Макс. вес на снаряде: <b>${bestSet.weight} кг</b>\n` : ''),
      openAppButton()
    );
    return NextResponse.json({ ok: true });
  }

  // ── /records ─────────────────────────────────────────────────────────────
  if (text === '/records') {
    const user = await getUserOrReply(chatId, String(from?.id));
    if (!user) return NextResponse.json({ ok: true });

    const sets = await prisma.workoutSet.findMany({
      where: { workout: { userId: user.id } },
      select: { exerciseId: true, weight: true, reps: true },
    });

    if (!sets.length) {
      await sendMessage(chatId, '🏋️ Пока нет записанных подходов.', openAppButton());
      return NextResponse.json({ ok: true });
    }

    // Best weight per exercise
    const recordMap = new Map<string, { weight: number; reps: number }>();
    for (const s of sets) {
      const cur = recordMap.get(s.exerciseId);
      if (!cur || s.weight > cur.weight) recordMap.set(s.exerciseId, { weight: s.weight, reps: s.reps });
    }

    // Get exercise names
    const exerciseIds = [...recordMap.keys()];
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, nameRu: true, name: true },
    });
    const nameMap = new Map(exercises.map((e) => [e.id, e.nameRu ?? e.name]));

    // Top 10 by weight
    const top = [...recordMap.entries()]
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 10);

    const medals = ['🥇', '🥈', '🥉'];
    const lines = top.map(([id, { weight, reps }], i) => {
      const medal = medals[i] ?? `${i + 1}.`;
      return `${medal} <b>${nameMap.get(id) ?? id}</b> — ${weight} кг × ${reps}`;
    });

    await sendMessage(
      chatId,
      `🏆 <b>Личные рекорды (топ-10)</b>\n\n${lines.join('\n')}`,
      openAppButton()
    );
    return NextResponse.json({ ok: true });
  }

  // ── /streak ──────────────────────────────────────────────────────────────
  if (text === '/streak') {
    const user = await getUserOrReply(chatId, String(from?.id));
    if (!user) return NextResponse.json({ ok: true });

    const workoutDays = await prisma.workout.findMany({
      where: { userId: user.id, finishedAt: { not: null } },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
    });

    if (!workoutDays.length) {
      await sendMessage(chatId, '🏃 Тренировок пока нет. Самое время начать!', openAppButton());
      return NextResponse.json({ ok: true });
    }

    const streak = calcStreak(workoutDays);

    // Best streak ever
    const seen = new Set(workoutDays.map((w) => w.startedAt.toISOString().slice(0, 10)));
    const days = [...seen].sort((a, b) => b.localeCompare(a));
    let bestStreak = 0;
    let cur = 0;
    let prev: string | null = null;
    for (const d of days) {
      if (prev === null) { cur = 1; }
      else {
        const diff = (new Date(prev).getTime() - new Date(d).getTime()) / 86400000;
        cur = diff === 1 ? cur + 1 : 1;
      }
      if (cur > bestStreak) bestStreak = cur;
      prev = d;
    }

    const lastDate = workoutDays[0].startedAt.toLocaleDateString('ru', { day: 'numeric', month: 'long' });

    await sendMessage(
      chatId,
      `🔥 <b>Стрик</b>\n\n` +
      `🔥 Текущий стрик: <b>${streak} дн.</b>\n` +
      `🏆 Рекорд за всё время: <b>${bestStreak} дн.</b>\n` +
      `📅 Последняя тренировка: <b>${lastDate}</b>\n` +
      `🏋️ Всего дней с тренировкой: <b>${seen.size}</b>\n\n` +
      (streak === 0 ? '😴 Сегодня ещё нет тренировки. Не ломай серию!' : '💪 Отличная серия, продолжай!'),
      openAppButton()
    );
    return NextResponse.json({ ok: true });
  }

  // ── /goal ────────────────────────────────────────────────────────────────
  if (text === '/goal') {
    const user = await getUserOrReply(chatId, String(from?.id));
    if (!user) return NextResponse.json({ ok: true });

    const lastWeight = await prisma.weightLog.findFirst({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    if (!lastWeight) {
      await sendMessage(chatId, '⚖️ Нет данных о весе. Запиши вес командой /weight 75.5', openAppButton());
      return NextResponse.json({ ok: true });
    }

    const current = lastWeight.weight;
    const goal = user.goalWeight;
    const height = user.heightCm;

    let lines = `⚖️ Текущий вес: <b>${current} кг</b>\n`;

    if (goal) {
      const diff = current - goal;
      let diffStr: string;
      if (diff > 0) diffStr = `осталось сбросить <b>${diff.toFixed(1)} кг</b>`;
      else if (diff < 0) diffStr = `перевыполнено на <b>${Math.abs(diff).toFixed(1)} кг</b> 🎉`;
      else diffStr = `цель достигнута! 🎉`;
      lines += `🎯 Цель: <b>${goal} кг</b> - ${diffStr}\n`;
    } else {
      lines += `🎯 Цель по весу не задана (задай в профиле)\n`;
    }

    if (height && current) {
      const bmi = current / ((height / 100) ** 2);
      let cat: string;
      if (bmi < 18.5) cat = 'Недостаток веса';
      else if (bmi < 25) cat = 'Норма ✅';
      else if (bmi < 30) cat = 'Избыток веса';
      else cat = 'Ожирение';
      lines += `📏 ИМТ: <b>${bmi.toFixed(1)}</b> — ${cat}\n`;
    }

    await sendMessage(chatId, `🎯 <b>Прогресс к цели</b>\n\n${lines}`, openAppButton());
    return NextResponse.json({ ok: true });
  }

  // ── /top ─────────────────────────────────────────────────────────────────
  if (text === '/top') {
    const [totalUsers, totalWorkoutsGlobal, users] = await Promise.all([
      prisma.user.count(),
      prisma.workout.count({ where: { finishedAt: { not: null } } }),
      prisma.user.findMany({
        include: {
          workouts: { where: { finishedAt: { not: null } }, include: { sets: true } },
        },
      }),
    ]);

    type UserRow = { name: string; workouts: number; volume: number; maxWeight: number };
    const rows: UserRow[] = users.map((u) => {
      const allSets = u.workouts.flatMap((w) => w.sets);
      const volume = allSets.reduce((acc, s) => acc + s.weight * s.reps, 0);
      const maxWeight = allSets.length ? Math.max(...allSets.map((s) => s.weight)) : 0;
      return { name: u.name ?? u.telegramUsername ?? 'Аноним', workouts: u.workouts.length, volume, maxWeight };
    });

    const byVolume = [...rows].sort((a, b) => b.volume - a.volume).slice(0, 3);
    const byWorkouts = [...rows].sort((a, b) => b.workouts - a.workouts).slice(0, 3);
    const byMax = [...rows].sort((a, b) => b.maxWeight - a.maxWeight).slice(0, 3);

    const medals = ['🥇', '🥈', '🥉'];
    const fmt = (arr: UserRow[], key: keyof UserRow, unit: string) =>
      arr.map((r, i) => `${medals[i]} <b>${r.name}</b> — ${Math.round(r[key] as number).toLocaleString('ru')} ${unit}`).join('\n');

    await sendMessage(
      chatId,
      `🌍 <b>Глобальный рейтинг</b>\n\n` +
      `👥 Всего пользователей: <b>${totalUsers}</b>\n` +
      `🏋️ Всего тренировок: <b>${totalWorkoutsGlobal}</b>\n\n` +
      `💪 <b>По объёму (кг):</b>\n${fmt(byVolume, 'volume', 'кг')}\n\n` +
      `📅 <b>По тренировкам:</b>\n${fmt(byWorkouts, 'workouts', 'тр.')}\n\n` +
      `🏆 <b>По макс. весу:</b>\n${fmt(byMax, 'maxWeight', 'кг')}`,
      openAppButton()
    );
    return NextResponse.json({ ok: true });
  }

  // ── /today ───────────────────────────────────────────────────────────────
  if (text === '/today') {
    const user = await getUserOrReply(chatId, String(from?.id));
    if (!user) return NextResponse.json({ ok: true });

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
    const dateStr = lastWorkout.startedAt.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
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
    const user = await getUserOrReply(chatId, String(from?.id));
    if (!user) return NextResponse.json({ ok: true });

    const value = Number.parseFloat(text.split(' ')[1] ?? '');
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
        userData: { id: cbFrom.id, first_name: cbFrom.first_name, last_name: cbFrom.last_name ?? null, username: cbFrom.username ?? null, photo_url: null },
      },
    });
    await answerCallback(update.callback_query.id, '✅ Вход подтверждён!');
    return NextResponse.json({ ok: true });
  }

  if (update.callback_query?.data === 'show_help') {
    await sendMessage(update.callback_query.message.chat.id, HELP_TEXT, openAppButton());
    await answerCallback(update.callback_query.id, '');
    return NextResponse.json({ ok: true });
  }

  // ── default ──────────────────────────────────────────────────────────────
  if (chatId && text && !text.startsWith('/')) {
    await sendMessage(chatId, `💪 Для подробностей открой приложение.\n\nВсе команды: /help`, openAppButton());
  }

  return NextResponse.json({ ok: true });
}
