'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spin } from 'antd';
import type { WeightLogEntry, WorkoutHistoryEntry, PersonalRecord } from '@/types';
import { WeightInput } from './WeightInput';
import { WeightHistory } from './WeightHistory';
import { WorkoutHistory } from './WorkoutHistory';
import { WorkoutCTA } from './WorkoutCTA';
import { BodyStatsCard } from './BodyStatsCard';
import { WeeklyReportCard } from './WeeklyReportCard';
import styles from './DashboardView.module.scss';

const WeightChart = dynamic(
  () => import('./WeightChart').then((m) => ({ default: m.WeightChart })),
  { ssr: false, loading: () => <div className={styles.chartSkeleton}><Spin /></div> }
);

const StreakCard = dynamic(
  () => import('./StreakCard').then((m) => ({ default: m.StreakCard })),
  { ssr: false, loading: () => <div className={styles.chartSkeleton}><Spin /></div> }
);

const ActivityHeatmap = dynamic(
  () => import('./ActivityHeatmap').then((m) => ({ default: m.ActivityHeatmap })),
  { ssr: false, loading: () => <div className={styles.chartSkeleton}><Spin /></div> }
);

const Achievements = dynamic(
  () => import('./Achievements').then((m) => ({ default: m.Achievements })),
  { ssr: false, loading: () => <div className={styles.chartSkeleton}><Spin /></div> }
);

const MuscleMap = dynamic(
  () => import('./MuscleMap').then((m) => ({ default: m.MuscleMap })),
  { ssr: false, loading: () => <div className={styles.chartSkeleton}><Spin /></div> }
);

const MuscleVolumeChart = dynamic(
  () => import('./MuscleVolumeChart').then((m) => ({ default: m.MuscleVolumeChart })),
  { ssr: false, loading: () => <div className={styles.chartSkeleton}><Spin /></div> }
);

const PersonalRecords = dynamic(
  () => import('./PersonalRecords').then((m) => ({ default: m.PersonalRecords })),
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
  goalWeight?: number | null;
  heightCm?: number | null;
  isGuest?: boolean;
}

export function DashboardView({ todayWeight, totalWorkouts, lastWorkoutDate, recentWorkouts, exerciseNames, exerciseImages, weightHistory, personalRecords, goalWeight, heightCm, isGuest }: Props) {
  const router = useRouter();
  const [currentWeight, setCurrentWeight] = useState<number | null>(todayWeight);
  const [chartRefreshKey, setChartRefreshKey] = useState(0);

  const handleWeightSaved = (entry: { id: string; weight: number }) => {
    setCurrentWeight(entry.weight);
    setChartRefreshKey((k) => k + 1);
    router.refresh();
  };

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
          <StreakCard />

          <BodyStatsCard
            currentWeight={currentWeight}
            goalWeight={goalWeight ?? null}
            heightCm={heightCm ?? null}
          />

          <div className={styles.prSection}>
            <span className={styles.sectionTitle}>Активность</span>
            <ActivityHeatmap />
          </div>

          <div className={styles.prSection}>
            <span className={styles.sectionTitle}>Достижения</span>
            <Achievements />
          </div>

          <div className={styles.prSection}>
            <span className={styles.sectionTitle}>Мышечная карта</span>
            <MuscleMap />
            <MuscleVolumeChart />
          </div>

          <div className={styles.prSection}>
            <span className={styles.sectionTitle}>Личные рекорды</span>
            <PersonalRecords records={personalRecords} />
          </div>

          <div className={styles.prSection}>
            <span className={styles.sectionTitle}>AI-отчёт недели</span>
            <WeeklyReportCard />
          </div>

          <div className={styles.weightSection}>
            <span className={styles.sectionTitle}>
              Вес сегодня{currentWeight != null ? ` — ${currentWeight} кг` : ''}
            </span>
            <WeightInput todayWeight={currentWeight} onSaved={handleWeightSaved} />
          </div>

          <div className={styles.chartSection}>
            <span className={styles.sectionTitle}>График веса</span>
            <WeightChart refreshKey={chartRefreshKey} goalWeight={goalWeight} />
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
