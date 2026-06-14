'use client';

import Link from 'next/link';
import styles from './BodyStatsCard.module.scss';

interface Props {
  currentWeight: number | null;
  goalWeight: number | null;
  heightCm: number | null;
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Недостаток', color: '#3b82f6' };
  if (bmi < 25) return { label: 'Норма', color: '#22c55e' };
  if (bmi < 30) return { label: 'Избыток', color: '#f59e0b' };
  return { label: 'Ожирение', color: '#ef4444' };
}

export function BodyStatsCard({ currentWeight, goalWeight, heightCm }: Props) {
  const bmi = currentWeight && heightCm
    ? Math.round((currentWeight / ((heightCm / 100) ** 2)) * 10) / 10
    : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  const goalDiff = currentWeight && goalWeight
    ? Math.round((currentWeight - goalWeight) * 10) / 10
    : null;

  const goalProgress = currentWeight && goalWeight && heightCm
    ? Math.max(0, Math.min(100, Math.round(100 - (Math.abs(currentWeight - goalWeight) / goalWeight) * 100)))
    : null;

  const hasData = bmi !== null || goalDiff !== null;
  if (!hasData) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Тело</span>
        <Link href="/profile" className={styles.editLink}>изменить цели →</Link>
      </div>

      <div className={styles.grid}>
        {bmi !== null && bmiInfo && (
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: bmiInfo.color }}>{bmi}</span>
            <span className={styles.statLabel}>ИМТ</span>
            <span className={styles.statSub} style={{ color: bmiInfo.color }}>{bmiInfo.label}</span>
          </div>
        )}

        {goalDiff !== null && (
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: goalDiff > 0 ? '#f59e0b' : goalDiff < 0 ? '#3b82f6' : '#22c55e' }}>
              {goalDiff > 0 ? `-${goalDiff}` : goalDiff < 0 ? `+${Math.abs(goalDiff)}` : '✓'}
            </span>
            <span className={styles.statLabel}>До цели (кг)</span>
            <span className={styles.statSub}>{goalWeight} кг цель</span>
          </div>
        )}
      </div>

      {goalProgress !== null && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${goalProgress}%`, background: goalDiff === 0 ? '#22c55e' : '#f59e0b' }}
            />
          </div>
          <span className={styles.progressLabel}>{goalProgress}% к цели</span>
        </div>
      )}
    </div>
  );
}
