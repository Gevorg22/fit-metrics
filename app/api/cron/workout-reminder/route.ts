import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { sendPushToAll } from '@/lib/push';

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

  const { sent, failed, expiredEndpoints } = await sendPushToAll(
    staleWorkouts.flatMap((w) => w.user.pushSubscriptions),
    payload
  );

  if (expiredEndpoints.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expiredEndpoints } } });
  }

  return NextResponse.json({ sent, failed, stale: staleWorkouts.length });
}
