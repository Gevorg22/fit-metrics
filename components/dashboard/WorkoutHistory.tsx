'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Popconfirm, message, Tooltip } from 'antd';
import { DeleteOutlined, RedoOutlined } from '@ant-design/icons';
import type { WorkoutHistoryEntry, WorkoutSetEntry } from '@/types';
import { getExerciseImageUrl, getDuration, formatSets, groupSetsByExercise } from '@/lib/utils';
import styles from './WorkoutHistory.module.scss';

interface Props {
  workouts: WorkoutHistoryEntry[];
  exerciseNames: Record<string, string>;
  exerciseImages: Record<string, string>;
}

const PAGE_SIZE = 5;

export function WorkoutHistory({ workouts: initial, exerciseNames, exerciseImages }: Props) {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [workouts, setWorkouts] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleRepeat = (w: WorkoutHistoryEntry) => {
    const exerciseIds = [...new Set(w.sets.map((s) => s.exerciseId))];
    sessionStorage.setItem('repeatExercises', JSON.stringify(exerciseIds));
    router.push('/workout');
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/workout/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      if (expanded === id) setExpanded(null);
      router.refresh();
    } catch {
      messageApi.error('Не удалось удалить тренировку');
    } finally {
      setDeleting(null);
    }
  };

  if (workouts.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🏋️</span>
        <span className={styles.emptyText}>Тренировок пока нет. Начни первую!</span>
      </div>
    );
  }

  const visible = workouts.slice(0, visibleCount);
  const hasMore = visibleCount < workouts.length;

  return (
    <div className={styles.wrap}>
      {contextHolder}
      <div className={styles.list}>
        {visible.map((w) => {
          const isOpen = expanded === w.id;
          const grouped = groupSetsByExercise(w.sets);
          const date = new Date(w.startedAt);
          const duration = getDuration(w.startedAt, w.finishedAt);
          const totalSets = w.sets.length;
          const exerciseCount = grouped.length;

          return (
            <div key={w.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <button
                  className={styles.itemToggle}
                  onClick={() => setExpanded(isOpen ? null : w.id)}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.dateDay}>
                      {date.toLocaleDateString('ru', { weekday: 'short' }).toUpperCase()}
                    </span>
                    <div className={styles.dateFull}>
                      <span className={styles.dateMain}>
                        {date.toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
                      </span>
                      <span className={styles.dateSub}>
                        {date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                        {duration && ` · ${duration}`}
                      </span>
                    </div>
                  </div>
                  <div className={styles.itemMeta}>
                    {exerciseCount > 0 && (
                      <span className={styles.metaBadge}>{exerciseCount} упр.</span>
                    )}
                    {totalSets > 0 && (
                      <span className={styles.metaBadge}>{totalSets} подх.</span>
                    )}
                    <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                      ›
                    </span>
                  </div>
                </button>

                <Popconfirm
                  title="Удалить тренировку?"
                  description="Все подходы этой тренировки будут удалены."
                  onConfirm={() => handleDelete(w.id)}
                  okText="Удалить"
                  cancelText="Отмена"
                  okButtonProps={{ danger: true }}
                >
                  <button
                    className={styles.deleteBtn}
                    disabled={deleting === w.id}
                    aria-label="Удалить тренировку"
                  >
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>

              {isOpen && (
                <div className={styles.itemBody}>
                  {w.notes && (
                    <p className={styles.notes}>{w.notes}</p>
                  )}
                  {grouped.length === 0 ? (
                    <p className={styles.noSets}>Подходы не записаны</p>
                  ) : (
                    grouped.map(({ exerciseId, sets }) => (
                      <div key={exerciseId} className={styles.exRow}>
                        {exerciseImages[exerciseId] && (
                          <div className={styles.exImg}>
                            <Image
                              src={getExerciseImageUrl(exerciseImages[exerciseId])}
                              alt={exerciseNames[exerciseId] ?? exerciseId}
                              width={36}
                              height={36}
                              className={styles.exImgEl}
                              unoptimized
                            />
                          </div>
                        )}
                        <div className={styles.exInfo}>
                          <span className={styles.exName}>{exerciseNames[exerciseId] ?? exerciseId}</span>
                          <span className={styles.exSets}>{formatSets(sets)}</span>
                        </div>
                      </div>
                    ))
                  )}
                  {grouped.length > 0 && (
                    <div className={styles.itemActions}>
                      <Tooltip title="Начать тренировку с теми же упражнениями">
                        <button
                          className={styles.repeatBtn}
                          onClick={() => handleRepeat(w)}
                        >
                          <RedoOutlined /> Повторить тренировку
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          className={styles.showMore}
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
        >
          Показать ещё ({workouts.length - visibleCount})
        </button>
      )}
    </div>
  );
}
