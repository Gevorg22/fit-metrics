'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { PersonalRecord } from '@/types';
import styles from './PersonalRecords.module.scss';

const ExerciseProgressModal = dynamic(
  () => import('./ExerciseProgressModal').then((m) => ({ default: m.ExerciseProgressModal })),
  { ssr: false }
);

interface Props {
  records: PersonalRecord[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function PersonalRecords({ records }: Props) {
  const [selected, setSelected] = useState<PersonalRecord | null>(null);

  if (records.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🏆</span>
        <span className={styles.emptyText}>Запиши первую тренировку — здесь появятся твои рекорды</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {records.map((r, i) => (
          <button
            key={r.exerciseId}
            className={`${styles.card} ${i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : ''}`}
            onClick={() => setSelected(r)}
            title="Посмотреть прогресс"
          >
            <span className={styles.medal}>{MEDALS[i] ?? `#${i + 1}`}</span>
            <span className={styles.name}>{r.exerciseName}</span>
            <div className={styles.result}>
              <span className={styles.weight}>{r.maxWeight}</span>
              <span className={styles.unit}>кг</span>
            </div>
            {r.maxReps && (
              <span className={styles.reps}>× {r.maxReps} повт.</span>
            )}
            {r.maxReps && r.maxReps > 1 && (
              <span className={styles.orm}>
                1RM ≈ {Math.round(r.maxWeight * (1 + r.maxReps / 30))} кг
              </span>
            )}
            <span className={styles.chartHint}>📈 прогресс</span>
          </button>
        ))}
      </div>

      <ExerciseProgressModal
        exerciseId={selected?.exerciseId ?? null}
        exerciseName={selected?.exerciseName ?? ''}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
