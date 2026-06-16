'use client';

import { useEffect, useState } from 'react';
import { Modal, Spin } from 'antd';
import styles from './UserStatsModal.module.scss';

interface UserStats {
  displayName: string;
  memberSince: string;
  workoutCount: number;
  totalVolume: number;
  maxWeight: number;
  totalDurMin: number;
  topExerciseName: string | null;
}

interface Props {
  userId: string | null;
  onClose: () => void;
}

function formatVolume(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} млн кг`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} т`;
  return `${kg} кг`;
}

function formatDur(min: number): string {
  if (min >= 60) return `${Math.round(min / 60)} ч`;
  return `${min} мин`;
}

export function UserStatsModal({ userId, onClose }: Props) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setStats(null);
    fetch(`/api/leaderboard/${userId}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <Modal
      open={!!userId}
      onCancel={onClose}
      footer={null}
      title={null}
      width={400}
      styles={{ body: { padding: 0 } }}
    >
      {loading && (
        <div className={styles.center}><Spin /></div>
      )}
      {!loading && stats && (
        <div className={styles.card}>
          <div className={styles.avatar}>
            {stats.displayName.slice(0, 1).toUpperCase()}
          </div>
          <h2 className={styles.name}>{stats.displayName}</h2>
          <p className={styles.since}>В приложении с {stats.memberSince}</p>

          <div className={styles.grid}>
            <div className={styles.stat}>
              <span className={styles.statVal}>{stats.workoutCount}</span>
              <span className={styles.statLabel}>тренировок</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{formatVolume(stats.totalVolume)}</span>
              <span className={styles.statLabel}>поднято</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{stats.maxWeight} кг</span>
              <span className={styles.statLabel}>макс. вес</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{formatDur(stats.totalDurMin)}</span>
              <span className={styles.statLabel}>в зале</span>
            </div>
          </div>

          {stats.topExerciseName && (
            <div className={styles.topEx}>
              <span className={styles.topExLabel}>Любимое упражнение</span>
              <span className={styles.topExName}>{stats.topExerciseName}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
