import { cache } from 'react';
import { cookies } from 'next/headers';
import { auth } from '@/auth';

/**
 * Сессия хранится в БД (`strategy: 'database'`), поэтому каждый вызов `auth()` —
 * это запрос в Postgres. Layout и page рендерятся в рамках одного запроса, так что
 * без мемоизации сессия читалась из базы дважды на каждую загрузку страницы.
 * `cache()` из React живёт ровно один серверный рендер и схлопывает это в один запрос.
 */
export const getSession = cache(async () => auth());

export const getIsGuest = cache(async () => {
  const store = await cookies();
  return store.get('fitmetrics-guest')?.value === '1';
});
