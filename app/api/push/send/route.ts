import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const DAYS_INACTIVE = 5;
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  if (CRON_SECRET) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_INACTIVE);

  const inactiveUsers = await prisma.user.findMany({
    where: {
      pushSubscriptions: { some: {} },
      workouts: {
        none: { startedAt: { gte: cutoff } },
      },
    },
    select: {
      pushSubscriptions: { select: { endpoint: true, p256dh: true, auth: true } },
    },
  });

  const payload = JSON.stringify({
    title: 'fitMetrics',
    body: 'Ты не тренировался 5 дней, самое время! 💪',
    url: '/',
  });

  let sent = 0;
  let failed = 0;

  for (const user of inactiveUsers) {
    for (const sub of user.pushSubscriptions) {
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

  return NextResponse.json({ sent, failed });
}
