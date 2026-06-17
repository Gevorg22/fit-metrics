import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const staleWorkouts = await prisma.workout.findMany({
    where: {
      finishedAt: null,
      startedAt: { lte: twoHoursAgo },
    },
    select: {
      id: true,
      startedAt: true,
      userId: true,
      user: {
        select: {
          pushSubscriptions: {
            select: { endpoint: true, p256dh: true, auth: true },
          },
        },
      },
    },
  });

  const payload = JSON.stringify({
    title: 'fitMetrics',
    body: 'Тренировка ещё не завершена! Не забудь завершить её 💪',
    url: '/workout',
  });

  let sent = 0;
  let failed = 0;

  for (const workout of staleWorkouts) {
    for (const sub of workout.user.pushSubscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch {
        failed++;
        await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
      }
    }
  }

  return NextResponse.json({ sent, failed, stale: staleWorkouts.length });
}
