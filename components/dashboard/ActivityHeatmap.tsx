'use client';

import { useEffect, useRef } from 'react';
import { useActivityData } from '@/hooks/useActivityData';
import styles from './ActivityHeatmap.module.scss';

const DAYS = 364;
const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const DAYS_RU = ['Пн', '', 'Ср', '', 'Пт', '', ''];

function buildGrid(): string[] {
  const today = new Date();
  const days: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function level(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

export function ActivityHeatmap() {
  const { data: counts, isLoading } = useActivityData();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && wrapRef.current) {
      wrapRef.current.scrollLeft = wrapRef.current.scrollWidth;
    }
  }, [isLoading]);

  const grid = buildGrid();

  const startDow = new Date(grid[0]).getDay();
  const mondayOffset = startDow === 0 ? 6 : startDow - 1;
  const padded = Array(mondayOffset).fill(null).concat(grid);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const first = week.find((d) => d !== null);
    if (first) {
      const m = new Date(first).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: MONTHS_RU[m], col: wi });
        lastMonth = m;
      }
    }
  });

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.monthRow}>
        {monthLabels.map(({ label, col }) => (
          <span key={`${label}-${col}`} className={styles.monthLabel} style={{ gridColumnStart: col + 1 }}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.dayLabels}>
          {DAYS_RU.map((d, i) => (
            <span key={i} className={styles.dayLabel}>{d}</span>
          ))}
        </div>

        <div className={styles.weeks}>
          {weeks.map((week, wi) => (
            <div key={wi} className={styles.week}>
              {week.map((date, di) => {
                if (!date) return <div key={di} className={styles.cell} />;
                const count = (counts ?? {})[date] ?? 0;
                const lv = level(count);
                return (
                  <div
                    key={di}
                    className={`${styles.cell} ${styles[`lv${lv}`]}`}
                    title={count > 0 ? `${date}: ${count} тренировок` : date}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendLabel}>Меньше</span>
        {[0, 1, 2, 3].map((l) => (
          <div key={l} className={`${styles.cell} ${styles[`lv${l}`]}`} />
        ))}
        <span className={styles.legendLabel}>Больше</span>
      </div>
    </div>
  );
}
