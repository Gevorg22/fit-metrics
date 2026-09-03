import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { sendPushToAll } from '@/lib/push';

const DAYS_INACTIVE = 5;

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

  const { sent, failed, expiredEndpoints } = await sendPushToAll(
    inactiveUsers.flatMap((u) => u.pushSubscriptions),
    payload
  );

  if (expiredEndpoints.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expiredEndpoints } } });
  }

  return NextResponse.json({ sent, failed });
}
