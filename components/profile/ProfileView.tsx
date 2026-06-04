'use client';

import { signOut } from 'next-auth/react';
import { Button } from 'antd';
import { LogoutOutlined, UserOutlined, TrophyOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import styles from './ProfileView.module.scss';

interface TopExercise {
  exerciseId: string;
  name: string;
  count: number;
}

interface Props {
  email: string;
  totalWorkouts: number;
  totalVolume: number;
  avgDurationMin: number;
  topExercises: TopExercise[];
}

function formatVolume(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} млн кг`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} т`;
  return `${kg} кг`;
}

export function ProfileView({ email, totalWorkouts, totalVolume, avgDurationMin, topExercises }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.avatar}>
          <UserOutlined />
        </div>
        <div className={styles.heroInfo}>
          <span className={styles.email}>{email}</span>
          <span className={styles.badge}>fitMetrics</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <TrophyOutlined className={styles.statIcon} />
          <span className={styles.statValue}>{totalWorkouts}</span>
          <span className={styles.statLabel}>Тренировок</span>
        </div>
        <div className={styles.statCard}>
          <FireOutlined className={styles.statIcon} />
          <span className={styles.statValue}>{formatVolume(totalVolume)}</span>
          <span className={styles.statLabel}>Поднято всего</span>
        </div>
        <div className={styles.statCard}>
          <ClockCircleOutlined className={styles.statIcon} />
          <span className={styles.statValue}>{avgDurationMin} мин</span>
          <span className={styles.statLabel}>Средняя тренировка</span>
        </div>
      </div>

      {topExercises.length > 0 && (
        <div className={styles.topSection}>
          <h3 className={styles.sectionTitle}>Любимые упражнения</h3>
          <div className={styles.topList}>
            {topExercises.map((ex, i) => (
              <div key={ex.exerciseId} className={styles.topRow}>
                <span className={styles.topRank}>#{i + 1}</span>
                <span className={styles.topName}>{ex.name}</span>
                <span className={styles.topCount}>{ex.count} подх.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          danger
          icon={<LogoutOutlined />}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
