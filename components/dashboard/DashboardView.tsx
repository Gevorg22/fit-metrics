'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { WeightInput } from './WeightInput';
import { WeightChart } from './WeightChart';
import { WeightHistory } from './WeightHistory';
import { WorkoutHistory } from './WorkoutHistory';
import { PersonalRecords } from './PersonalRecords';
import styles from './DashboardView.module.scss';

interface SetEntry {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
}

interface WorkoutEntry {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  sets: SetEntry[];
}

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

interface PREntry {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number | null;
}

interface Props {
  todayWeight: number | null;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
  recentWorkouts: WorkoutEntry[];
  exerciseNames: Record<string, string>;
  weightHistory: WeightEntry[];
  personalRecords: PREntry[];
  isGuest?: boolean;
}

export function DashboardView({ todayWeight, totalWorkouts, lastWorkoutDate, recentWorkouts, exerciseNames, weightHistory, personalRecords, isGuest }: Props) {
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

      <div className={styles.ctaCard}>
        <div className={styles.ctaText}>
          <span className={styles.ctaTitle}>Готов к тренировке?</span>
          <span className={styles.ctaSub}>Выбери упражнение и фиксируй подходы</span>
        </div>
        <Link href="/workout">
          <Button type="primary" size="large" icon={<ThunderboltOutlined />}>
            Начать тренировку
          </Button>
        </Link>
      </div>

      {!isGuest && (
        <>
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
        <span className={styles.sectionTitle}>
          История тренировок
          {recentWorkouts.length > 0 && (
            <span className={styles.historyCount}>{recentWorkouts.length}</span>
          )}
        </span>
        {isGuest ? (
          <p className={styles.guestNote}>Войди в аккаунт, чтобы сохранять тренировки</p>
        ) : (
          <WorkoutHistory workouts={recentWorkouts} exerciseNames={exerciseNames} />
        )}
      </div>
    </div>
  );
}
