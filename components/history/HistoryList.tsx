'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Popconfirm, message } from 'antd';
import { DeleteOutlined, LeftOutlined, RightOutlined, ShareAltOutlined } from '@ant-design/icons';
import type { WorkoutHistoryEntry, WorkoutSetEntry } from '@/types';
import styles from './HistoryList.module.scss';

const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

interface Props {
  workouts: WorkoutHistoryEntry[];
  exerciseNames: Record<string, string>;
  exerciseImages: Record<string, string>;
  page: number;
  totalPages: number;
  total: number;
}

function getDuration(start: string, end: string | null): string {
  if (!end) return '';
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} мин`;
  return `${Math.floor(mins / 60)}ч ${mins % 60}м`;
}

function groupSets(sets: WorkoutSetEntry[]): { exerciseId: string; sets: WorkoutSetEntry[] }[] {
  const map = new Map<string, WorkoutSetEntry[]>();
  for (const s of sets) {
    if (!map.has(s.exerciseId)) map.set(s.exerciseId, []);
    map.get(s.exerciseId)!.push(s);
  }
  return Array.from(map.entries()).map(([exerciseId, sets]) => ({ exerciseId, sets }));
}

function formatSets(sets: WorkoutSetEntry[]): string {
  return sets.map((s) => `${s.weight}кг×${s.reps}`).join(', ');
}

export function HistoryList({ workouts: initial, exerciseNames, exerciseImages, page, totalPages, total }: Props) {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [workouts, setWorkouts] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleShare = async (w: WorkoutHistoryEntry) => {
    const date = new Date(w.startedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
    const duration = getDuration(w.startedAt, w.finishedAt);
    const grouped = groupSets(w.sets);
    const lines = grouped.map(({ exerciseId, sets }) => {
      const name = exerciseNames[exerciseId] ?? exerciseId;
      const setsStr = sets.map((s) => `${s.weight}кг×${s.reps}`).join(', ');
      return `• ${name}: ${setsStr}`;
    });
    const text = [
      `🏋️ Тренировка ${date}${duration ? ` · ${duration}` : ''}`,
      '',
      ...lines,
      '',
      '📲 fitMetrics — https://fit-metrics-xi.vercel.app',
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: `Тренировка ${date}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        messageApi.success('Скопировано в буфер обмена');
      }
    } catch {}
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
        <span className={styles.emptyText}>Тренировок пока нет</span>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {contextHolder}

      <div className={styles.list}>
        {workouts.map((w) => {
          const isOpen = expanded === w.id;
          const grouped = groupSets(w.sets);
          const date = new Date(w.startedAt);
          const duration = getDuration(w.startedAt, w.finishedAt);

          return (
            <div key={w.id} className={styles.item}>
              <div className={styles.row}>
                <button
                  className={styles.toggle}
                  onClick={() => setExpanded(isOpen ? null : w.id)}
                >
                  <div className={styles.dateBlock}>
                    <span className={styles.dateDay}>
                      {date.toLocaleDateString('ru', { weekday: 'short' }).toUpperCase()}
                    </span>
                    <div className={styles.dateInfo}>
                      <span className={styles.dateMain}>
                        {date.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className={styles.dateSub}>
                        {date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                        {duration && ` · ${duration}`}
                      </span>
                    </div>
                  </div>

                  <div className={styles.meta}>
                    {grouped.length > 0 && (
                      <span className={styles.badge}>{grouped.length} упр.</span>
                    )}
                    {w.sets.length > 0 && (
                      <span className={styles.badge}>{w.sets.length} подх.</span>
                    )}
                    <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>›</span>
                  </div>
                </button>

                <button
                  className={styles.shareBtn}
                  onClick={() => handleShare(w)}
                  aria-label="Поделиться"
                  title="Поделиться тренировкой"
                >
                  <ShareAltOutlined />
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
                    aria-label="Удалить"
                  >
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>

              {isOpen && (
                <div className={styles.detail}>
                  {w.notes && <p className={styles.notes}>{w.notes}</p>}
                  {grouped.length === 0 ? (
                    <p className={styles.noSets}>Подходы не записаны</p>
                  ) : (
                    <div className={styles.exList}>
                      {grouped.map(({ exerciseId, sets }) => (
                        <div key={exerciseId} className={styles.exRow}>
                          {exerciseImages[exerciseId] && (
                            <div className={styles.exImg}>
                              <Image
                                src={`${IMG_BASE}${exerciseImages[exerciseId]}`}
                                alt={exerciseNames[exerciseId] ?? exerciseId}
                                width={40}
                                height={40}
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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Link
            href={`/history?page=${page - 1}`}
            className={`${styles.pageBtn} ${page <= 1 ? styles.pageBtnDisabled : ''}`}
            aria-disabled={page <= 1}
            onClick={(e) => page <= 1 && e.preventDefault()}
          >
            <LeftOutlined /> Назад
          </Link>

          <span className={styles.pageInfo}>
            {page} / {totalPages}
          </span>

          <Link
            href={`/history?page=${page + 1}`}
            className={`${styles.pageBtn} ${page >= totalPages ? styles.pageBtnDisabled : ''}`}
            aria-disabled={page >= totalPages}
            onClick={(e) => page >= totalPages && e.preventDefault()}
          >
            Вперёд <RightOutlined />
          </Link>
        </div>
      )}
    </div>
  );
}
