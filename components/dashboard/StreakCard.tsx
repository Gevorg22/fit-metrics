'use client';

import { useEffect, useState } from 'react';
import styles from './StreakCard.module.scss';

interface StreakData {
  current: number;
  longest: number;
  lastWorkoutDate: string | null;
}

function daysAgoText(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'вчера';
  return `${diff} дн. назад`;
}

export function StreakCard() {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    fetch('/api/analytics/streak')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => null);
  }, []);

  if (!data) return null;

  const flame = data.current >= 7 ? '🔥' : data.current >= 3 ? '⚡' : data.current >= 1 ? '✨' : '💤';

  return (
    <div className={styles.card}>
      <div className={styles.main}>
        <span className={styles.icon}>{flame}</span>
        <div className={styles.info}>
          <span className={styles.count}>
            {data.current} <span className={styles.unit}>{data.current === 1 ? 'день' : data.current < 5 ? 'дня' : 'дней'} подряд</span>
          </span>
          {data.lastWorkoutDate && (
            <span className={styles.last}>Последняя: {daysAgoText(data.lastWorkoutDate)}</span>
          )}
        </div>
      </div>
      {data.longest > 0 && (
        <div className={styles.best}>
          Рекорд: <strong>{data.longest} {data.longest === 1 ? 'день' : data.longest < 5 ? 'дня' : 'дней'}</strong>
        </div>
      )}
    </div>
  );
}
