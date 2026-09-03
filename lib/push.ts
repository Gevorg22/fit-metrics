import webpush from 'web-push';

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushResult {
  sent: number;
  failed: number;
  /** Подписки, которых больше не существует — их можно удалять из БД. */
  expiredEndpoints: string[];
}

/** Сколько отправок держим в полёте одновременно. */
const BATCH_SIZE = 20;

/** Коды, которыми push-сервис сообщает, что подписки больше нет. */
const GONE_STATUSES = new Set([404, 410]);

/**
 * Раньше рассылка шла строго по одной подписке за раз, и время запроса росло
 * линейно с их числом — на проде это давало 27 секунд на один прогон крона.
 * Отправка почти целиком состоит из ожидания сети, поэтому пачки уходят
 * параллельно.
 */
export async function sendPushToAll(targets: PushTarget[], payload: string): Promise<PushResult> {
  // Один и тот же endpoint может прийти дважды (например, у пользователя
  // несколько незавершённых тренировок) — дубли шлют одно и то же уведомление.
  const unique = [...new Map(targets.map((t) => [t.endpoint, t])).values()];

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((t) =>
        webpush.sendNotification(
          { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
          payload
        )
      )
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        sent++;
        return;
      }
      failed++;
      // Удаляем только протухшие подписки. Раньше сносилась любая, упавшая
      // по любой причине, — из-за разовой сетевой ошибки терялась живая.
      const statusCode = (result.reason as { statusCode?: number } | null)?.statusCode;
      if (statusCode !== undefined && GONE_STATUSES.has(statusCode)) {
        expiredEndpoints.push(batch[idx].endpoint);
      }
    });
  }

  return { sent, failed, expiredEndpoints };
}
