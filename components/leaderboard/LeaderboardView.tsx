'use client';

import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { UserStatsModal } from './UserStatsModal';
import styles from './LeaderboardView.module.scss';

interface LeaderRow {
  userId: string;
  displayName: string;
  image: string | null;
  isMe: boolean;
  totalVolume: number;
  maxWeight: number;
  workoutCount: number;
}

interface LeaderboardData {
  byVolume: LeaderRow[];
  byWorkouts: LeaderRow[];
  byMaxWeight: LeaderRow[];
}

type Tab = 'byVolume' | 'byWorkouts' | 'byMaxWeight';

const TABS: { key: Tab; label: string; unit: (r: LeaderRow) => string }[] = [
  {
    key: 'byVolume',
    label: 'Объём',
    unit: (r) => {
      const kg = r.totalVolume;
      if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} млн кг`;
      if (kg >= 1000) return `${(kg / 1000).toFixed(1)} т`;
      return `${kg} кг`;
    },
  },
  { key: 'byWorkouts', label: 'Тренировки', unit: (r) => `${r.workoutCount} тр.` },
  { key: 'byMaxWeight', label: 'Макс. вес', unit: (r) => `${r.maxWeight} кг` },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardView() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('byVolume');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const currentTab = TABS.find((t) => t.key === tab)!;
  const rows = data?.[tab] ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Рейтинг</h1>
        <p className={styles.sub}>Топ-10 по всем пользователям</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className={styles.center}><Spin /></div>
      )}

      {!loading && rows.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🏋️</span>
          <p>Пока нет данных. Заверши первую тренировку!</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className={styles.list}>
          {rows.map((row, idx) => (
            <button
              key={row.userId}
              className={`${styles.row} ${row.isMe ? styles.rowMe : ''}`}
              onClick={() => setSelectedUser(row.userId)}
            >
              <div className={styles.rank}>
                {idx < 3 ? (
                  <span className={styles.medal}>{MEDALS[idx]}</span>
                ) : (
                  <span className={styles.rankNum}>{idx + 1}</span>
                )}
              </div>

              <div className={styles.avatar}>
                {row.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image} alt={row.displayName} className={styles.avatarImg} />
                ) : (
                  row.displayName.slice(0, 1).toUpperCase()
                )}
              </div>

              <div className={styles.info}>
                <span className={styles.name}>
                  {row.displayName}
                  {row.isMe && <span className={styles.meBadge}>Я</span>}
                </span>
                <span className={styles.meta}>
                  {row.workoutCount} тр. · макс {row.maxWeight} кг
                </span>
              </div>

              <div className={styles.value}>
                {currentTab.unit(row)}
              </div>
            </button>
          ))}
        </div>
      )}

      <UserStatsModal
        userId={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
