'use client';

import { useEffect, useState } from 'react';
import styles from './MuscleVolumeChart.module.scss';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Грудь',
  pectorals: 'Грудь',
  lats: 'Широчайшие',
  back: 'Спина',
  shoulders: 'Плечи',
  delts: 'Плечи',
  'levator-scapulae': 'Плечи',
  'serratus-anterior': 'Плечи',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  quadriceps: 'Квадрицепс',
  quads: 'Квадрицепс',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  abdominals: 'Пресс',
  abs: 'Пресс',
  traps: 'Трапеции',
  forearms: 'Предплечья',
  calves: 'Икры',
  adductors: 'Приводящие',
  abductors: 'Отводящие',
  'lower back': 'Нижняя спина',
  lower_back: 'Нижняя спина',
  'middle back': 'Средняя спина',
  middle_back: 'Средняя спина',
  'upper-back': 'Верхняя спина',
  spine: 'Нижняя спина',
  neck: 'Шея',
  legs: 'Ноги',
  cardio: 'Кардио',
};

function mergeLabel(key: string): string {
  return MUSCLE_LABELS[key] ?? key;
}

interface BarEntry {
  label: string;
  sets: number;
  pct: number;
}

export function MuscleVolumeChart() {
  const [data, setData] = useState<BarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/muscles')
      .then((r) => r.json())
      .then((raw: Record<string, number>) => {
        const merged: Record<string, number> = {};
        for (const [key, val] of Object.entries(raw)) {
          const label = mergeLabel(key);
          merged[label] = (merged[label] ?? 0) + val;
        }
        const entries = Object.entries(merged)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        const max = entries[0]?.[1] ?? 1;
        setData(entries.map(([label, sets]) => ({ label, sets, pct: Math.round((sets / max) * 100) })));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.empty}>Загрузка...</div>;
  if (data.length === 0) return <div className={styles.empty}>Нет данных за последние 7 дней</div>;

  return (
    <div className={styles.wrap}>
      {data.map(({ label, sets, pct }) => (
        <div key={label} className={styles.row}>
          <span className={styles.label}>{label}</span>
          <div className={styles.barWrap}>
            <div className={styles.bar} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.count}>{sets} подх.</span>
        </div>
      ))}
    </div>
  );
}
