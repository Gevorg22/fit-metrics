import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string) {
  return (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
}

function calcLongestStreak(dates: string[]): number {
  if (!dates.length) return 0;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (diffDays(dates[i - 1], dates[i]) === 1) run++;
    else { longest = Math.max(longest, run); run = 1; }
  }
  return Math.max(longest, run);
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [workouts, sets, goalsCount] = await Promise.all([
    prisma.workout.findMany({
      where: { userId: session.user.id, finishedAt: { not: null } },
      select: { id: true, startedAt: true, finishedAt: true, sets: { select: { weight: true, reps: true, exerciseId: true } } },
      orderBy: { startedAt: 'asc' },
    }),
    prisma.workoutSet.groupBy({
      by: ['workoutId'],
      where: { workout: { userId: session.user.id } },
      _sum: { weight: true },
    }),
    prisma.exerciseGoal.count({ where: { userId: session.user.id } }),
  ]);

  const total = workouts.length;
  const dates = workouts.map((w) => toDateStr(w.startedAt));
  const longestStreak = calcLongestStreak(dates);

  const volumeByWorkout = Object.fromEntries(sets.map((s) => [s.workoutId, s._sum.weight ?? 0]));
  const maxVolume = Math.max(0, ...Object.values(volumeByWorkout));
  const totalVolume = Object.values(volumeByWorkout).reduce((a, b) => a + b, 0);

  const earlyBirdCount = workouts.filter((w) => {
    const h = w.startedAt.getUTCHours();
    return h >= 3 && h < 8;
  }).length;
  const nightOwlCount = workouts.filter((w) => {
    const h = w.startedAt.getUTCHours();
    return h >= 19 && h < 24;
  }).length;
  const weekendCount = workouts.filter((w) => {
    const d = w.startedAt.getUTCDay();
    return d === 0 || d === 6;
  }).length;
  const mondayCount = workouts.filter((w) => w.startedAt.getUTCDay() === 1).length;

  const maxExercisesInOne = Math.max(
    0,
    ...workouts.map((w) => new Set(w.sets.map((s) => s.exerciseId)).size)
  );

  const maxDurationMin = Math.max(
    0,
    ...workouts
      .filter((w) => w.finishedAt)
      .map((w) => (new Date(w.finishedAt!).getTime() - new Date(w.startedAt).getTime()) / 60000)
  );

  const uniqueExercisesTotal = new Set(workouts.flatMap((w) => w.sets.map((s) => s.exerciseId))).size;

  const achievements: Achievement[] = [
    {
      id: 'first_workout',
      title: 'Первый шаг',
      description: 'Завершить первую тренировку',
      icon: '🏅',
      unlocked: total >= 1,
      unlockedAt: total >= 1 ? workouts[0].startedAt.toISOString() : undefined,
    },
    {
      id: 'workouts_5',
      title: 'Пятёрка',
      description: '5 тренировок',
      icon: '5️⃣',
      unlocked: total >= 5,
      unlockedAt: total >= 5 ? workouts[4].startedAt.toISOString() : undefined,
    },
    {
      id: 'ten_workouts',
      title: 'Десятка',
      description: '10 тренировок',
      icon: '🔟',
      unlocked: total >= 10,
      unlockedAt: total >= 10 ? workouts[9].startedAt.toISOString() : undefined,
    },
    {
      id: 'workouts_25',
      title: 'Четверть сотни',
      description: '25 тренировок',
      icon: '🥈',
      unlocked: total >= 25,
      unlockedAt: total >= 25 ? workouts[24].startedAt.toISOString() : undefined,
    },
    {
      id: 'fifty_workouts',
      title: 'Марафонец',
      description: '50 тренировок',
      icon: '💪',
      unlocked: total >= 50,
      unlockedAt: total >= 50 ? workouts[49].startedAt.toISOString() : undefined,
    },
    {
      id: 'hundred_workouts',
      title: 'Сотня',
      description: '100 тренировок',
      icon: '🌟',
      unlocked: total >= 100,
      unlockedAt: total >= 100 ? workouts[99].startedAt.toISOString() : undefined,
    },
    {
      id: 'veteran',
      title: 'Ветеран',
      description: '250 тренировок',
      icon: '🏆',
      unlocked: total >= 250,
      unlockedAt: total >= 250 ? workouts[249].startedAt.toISOString() : undefined,
    },
    {
      id: 'workouts_500',
      title: 'Легенда',
      description: '500 тренировок',
      icon: '👑',
      unlocked: total >= 500,
      unlockedAt: total >= 500 ? workouts[499].startedAt.toISOString() : undefined,
    },
    {
      id: 'streak_3',
      title: 'Разгон',
      description: '3 дня подряд',
      icon: '🔥',
      unlocked: longestStreak >= 3,
    },
    {
      id: 'streak_7',
      title: 'Недельный ритм',
      description: '7 дней подряд',
      icon: '⚡',
      unlocked: longestStreak >= 7,
    },
    {
      id: 'streak_14',
      title: 'Две недели',
      description: '14 дней подряд',
      icon: '💎',
      unlocked: longestStreak >= 14,
    },
    {
      id: 'streak_30',
      title: 'Месяц без пропусков',
      description: '30 дней подряд',
      icon: '🦾',
      unlocked: longestStreak >= 30,
    },
    {
      id: 'streak_60',
      title: 'Два месяца',
      description: '60 дней подряд',
      icon: '🌀',
      unlocked: longestStreak >= 60,
    },
    {
      id: 'streak_100',
      title: 'Сто дней',
      description: '100 дней подряд',
      icon: '🌊',
      unlocked: longestStreak >= 100,
    },
    {
      id: 'volume_1t',
      title: 'Первая тонна',
      description: '1 000 кг за одну тренировку',
      icon: '🎯',
      unlocked: maxVolume >= 1000,
    },
    {
      id: 'volume_5t',
      title: 'Пять тонн',
      description: '5 000 кг за одну тренировку',
      icon: '💥',
      unlocked: maxVolume >= 5000,
    },
    {
      id: 'volume_10t',
      title: 'Десять тонн',
      description: '10 000 кг за одну тренировку',
      icon: '🏋️',
      unlocked: maxVolume >= 10000,
    },
    {
      id: 'volume_100t',
      title: 'Сто тонн суммарно',
      description: '100 000 кг за всё время',
      icon: '🚀',
      unlocked: totalVolume >= 100_000,
    },
    {
      id: 'volume_1m',
      title: 'Миллион',
      description: '1 000 000 кг за всё время',
      icon: '🌍',
      unlocked: totalVolume >= 1_000_000,
    },
    {
      id: 'early_bird',
      title: 'Ранняя птица',
      description: 'Тренировка до 8:00',
      icon: '🌅',
      unlocked: earlyBirdCount >= 1,
    },
    {
      id: 'early_bird_5',
      title: 'Жаворонок',
      description: '5 тренировок до 8:00',
      icon: '☀️',
      unlocked: earlyBirdCount >= 5,
    },
    {
      id: 'night_owl',
      title: 'Сова',
      description: 'Тренировка после 19:00',
      icon: '🌙',
      unlocked: nightOwlCount >= 1,
    },
    {
      id: 'night_owl_5',
      title: 'Полуночник',
      description: '5 тренировок после 19:00',
      icon: '🦉',
      unlocked: nightOwlCount >= 5,
    },
    {
      id: 'weekend_warrior',
      title: 'Боец выходного дня',
      description: 'Тренировка в выходной',
      icon: '🎉',
      unlocked: weekendCount >= 1,
    },
    {
      id: 'monday_starter',
      title: 'Понедельник — день тяжёлый',
      description: '10 тренировок в понедельник',
      icon: '📅',
      unlocked: mondayCount >= 10,
    },
    {
      id: 'variety',
      title: 'Разнообразие',
      description: '6+ упражнений за одну тренировку',
      icon: '🎪',
      unlocked: maxExercisesInOne >= 6,
    },
    {
      id: 'variety_10',
      title: 'Полная программа',
      description: '10+ упражнений за одну тренировку',
      icon: '📋',
      unlocked: maxExercisesInOne >= 10,
    },
    {
      id: 'explorer',
      title: 'Исследователь',
      description: '20+ разных упражнений за всё время',
      icon: '🗺️',
      unlocked: uniqueExercisesTotal >= 20,
    },
    {
      id: 'explorer_50',
      title: 'Энциклопедист',
      description: '50+ разных упражнений за всё время',
      icon: '📚',
      unlocked: uniqueExercisesTotal >= 50,
    },
    {
      id: 'marathon_duration',
      title: 'Марафон',
      description: 'Тренировка длиннее 2 часов',
      icon: '⏳',
      unlocked: maxDurationMin >= 120,
    },
    {
      id: 'goal_setter',
      title: 'Целеустремлённый',
      description: 'Поставить первую цель на упражнение',
      icon: '🎯',
      unlocked: goalsCount >= 1,
    },
    {
      id: 'goal_5',
      title: 'Амбициозный',
      description: 'Поставить 5 целей на упражнения',
      icon: '🏹',
      unlocked: goalsCount >= 5,
    },
  ];

  return NextResponse.json(achievements, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  });
}
