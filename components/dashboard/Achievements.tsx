'use client';

import { useState } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import styles from './Achievements.module.scss';

export function Achievements() {
  const { data: items, isLoading } = useAchievements();
  const [showAll, setShowAll] = useState(false);

  if (isLoading) return null;

  const unlocked = items.filter((a) => a.unlocked);
  const locked = items.filter((a) => !a.unlocked);
  const visible = showAll
    ? items
    : [...unlocked, ...locked.slice(0, Math.max(0, 4 - unlocked.length))];

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {visible.map((a) => (
          <div
            key={a.id}
            className={`${styles.badge} ${a.unlocked ? styles.badgeUnlocked : styles.badgeLocked}`}
          >
            <span className={styles.badgeIcon}>{a.icon}</span>
            <span className={styles.badgeTitle}>{a.title}</span>
            <span className={styles.badgeDesc}>{a.description}</span>
            {a.unlocked && a.unlockedAt && (
              <span className={styles.badgeDate}>
                {new Date(a.unlockedAt).toLocaleDateString('ru', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        ))}
      </div>

      {items.length > visible.length && (
        <button className={styles.showMore} onClick={() => setShowAll(true)}>
          Показать все ({locked.length} заблокировано)
        </button>
      )}

      {showAll && locked.length > 0 && (
        <button className={styles.showMore} onClick={() => setShowAll(false)}>
          Скрыть
        </button>
      )}
    </div>
  );
}
