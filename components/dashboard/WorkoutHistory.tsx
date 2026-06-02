'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import styles from './WorkoutHistory.module.scss';

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

interface Props {
  workouts: WorkoutEntry[];
  exerciseNames: Record<string, string>;
}

function getDuration(start: string, end: string | null): string {
  if (!end) return '';
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} мин`;
  return `${Math.floor(mins / 60)}ч ${mins % 60}м`;
}

function groupSetsByExercise(sets: SetEntry[]): { exerciseId: string; sets: SetEntry[] }[] {
  const map = new Map<string, SetEntry[]>();
  for (const s of sets) {
    if (!map.has(s.exerciseId)) map.set(s.exerciseId, []);
    map.get(s.exerciseId)!.push(s);
  }
  return Array.from(map.entries()).map(([exerciseId, sets]) => ({ exerciseId, sets }));
}

function formatSets(sets: SetEntry[]): string {
  return sets.map((s) => `${s.weight}кг×${s.reps}`).join(', ');
}

export function WorkoutHistory({ workouts: initial, exerciseNames }: Props) {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [workouts, setWorkouts] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  return (
    <div className={styles.list}>
      {contextHolder}
      {workouts.map((w) => {
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
                {grouped.length === 0 ? (
                  <p className={styles.noSets}>Подходы не записаны</p>
                ) : (
                  grouped.map(({ exerciseId, sets }) => (
                    <div key={exerciseId} className={styles.exRow}>
                      <span className={styles.exName}>{exerciseNames[exerciseId] ?? exerciseId}</span>
                      <span className={styles.exSets}>{formatSets(sets)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
