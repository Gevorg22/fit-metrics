'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Spin } from 'antd';
import type { WeightLogEntry, WorkoutHistoryEntry, PersonalRecord } from '@/types';
import { WeightInput } from './WeightInput';
import { WeightHistory } from './WeightHistory';
import { WorkoutHistory } from './WorkoutHistory';
import { PersonalRecords } from './PersonalRecords';
import { ActivityHeatmap } from './ActivityHeatmap';
import { MuscleMap } from './MuscleMap';
import { WorkoutCTA } from './WorkoutCTA';
import styles from './DashboardView.module.scss';

const WeightChart = dynamic(
  () => import('./WeightChart').then((m) => ({ default: m.WeightChart })),
  { ssr: false, loading: () => <div className={styles.chartSkeleton}><Spin /></div> }
);

interface Props {
  todayWeight: number | null;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
  recentWorkouts: WorkoutHistoryEntry[];
  exerciseNames: Record<string, string>;
  exerciseImages: Record<string, string>;
  weightHistory: WeightLogEntry[];
  personalRecords: PersonalRecord[];
  isGuest?: boolean;
}

export function DashboardView({ todayWeight, totalWorkouts, lastWorkoutDate, recentWorkouts, exerciseNames, exerciseImages, weightHistory, personalRecords, isGuest }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Всего тренировок</span>
          <span className={styles.statValue}>{totalWorkouts}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Последняя тренировка</span>
          <span className={styles.statValue}>
            {lastWorkoutDate
              ? new Date(lastWorkoutDate).toLocaleDateString('ru', {
                  day: 'numeric',
                  month: 'short',
                })
              : '—'}
          </span>
        </div>
      </div>

      <WorkoutCTA />

      {!isGuest && (
        <>
          <div className={styles.prSection}>
            <span className={styles.sectionTitle}>Активность</span>
            <ActivityHeatmap />
          </div>

          <div className={styles.prSection}>
            <span className={styles.sectionTitle}>Мышечная карта — эта неделя</span>
            <MuscleMap />
          </div>

          <div className={styles.prSection}>
            <span className={styles.sectionTitle}>Личные рекорды</span>
            <PersonalRecords records={personalRecords} />
          </div>

          <div className={styles.weightSection}>
            <span className={styles.sectionTitle}>Вес сегодня</span>
            <WeightInput todayWeight={todayWeight} />
          </div>

          <div className={styles.chartSection}>
            <span className={styles.sectionTitle}>График веса</span>
            <WeightChart />
          </div>

          <div className={styles.historySection}>
            <span className={styles.sectionTitle}>
              История веса
              {weightHistory.length > 0 && (
                <span className={styles.historyCount}>{weightHistory.length}</span>
              )}
            </span>
            <WeightHistory entries={weightHistory} />
          </div>
        </>
      )}

      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Последние тренировки</span>
          {!isGuest && (
            <Link href="/history" className={styles.viewAll}>
              Вся история →
            </Link>
          )}
        </div>
        {isGuest ? (
          <p className={styles.guestNote}>Войди в аккаунт, чтобы сохранять тренировки</p>
        ) : (
          <WorkoutHistory workouts={recentWorkouts} exerciseNames={exerciseNames} exerciseImages={exerciseImages} />
        )}
      </div>
    </div>
  );
}
