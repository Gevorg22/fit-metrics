'use client';

import { useStreak } from '@/hooks/useStreak';
import styles from './StreakCard.module.scss';

function daysAgoText(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'вчера';
  return `${diff} дн. назад`;
}

export function StreakCard() {
  const { data } = useStreak();

  if (!data) return null;

  const flame =
    data.current >= 7 ? '🔥' : data.current >= 3 ? '⚡' : data.current >= 1 ? '✨' : '💤';

  return (
    <div className={styles.card}>
      <div className={styles.main}>
        <span className={styles.icon}>{flame}</span>
        <div className={styles.info}>
          <span className={styles.count}>
            {data.current}{' '}
            <span className={styles.unit}>
              {data.current === 1 ? 'день' : data.current < 5 ? 'дня' : 'дней'} подряд
            </span>
          </span>
          {data.lastWorkoutDate && (
            <span className={styles.last}>
              Последняя: {daysAgoText(data.lastWorkoutDate)}
            </span>
          )}
        </div>
      </div>
      {data.longest > 0 && (
        <div className={styles.best}>
          Рекорд:{' '}
          <strong>
            {data.longest}{' '}
            {data.longest === 1 ? 'день' : data.longest < 5 ? 'дня' : 'дней'}
          </strong>
        </div>
      )}
    </div>
  );
}
