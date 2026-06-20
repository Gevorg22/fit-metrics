'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { PersonalRecord } from '@/types';
import { useGoals } from '@/hooks/useGoals';
import styles from './PersonalRecords.module.scss';

const ExerciseProgressModal = dynamic(
  () => import('./ExerciseProgressModal').then((m) => ({ default: m.ExerciseProgressModal })),
  { ssr: false }
);

const SetGoalModal = dynamic(
  () => import('./SetGoalModal').then((m) => ({ default: m.SetGoalModal })),
  { ssr: false }
);

interface Props {
  records: PersonalRecord[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function PersonalRecords({ records }: Props) {
  const [selected, setSelected] = useState<PersonalRecord | null>(null);
  const [goalTarget, setGoalTarget] = useState<PersonalRecord | null>(null);
  const { data: goals } = useGoals();

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
        {records.map((r, i) => {
          const goal = goals.find((g) => g.exerciseId === r.exerciseId) ?? null;
          const pct = goal ? Math.min(100, Math.round((goal.currentWeight / goal.targetWeight) * 100)) : null;
          const daysLeft = goal
            ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000)
            : null;

          return (
            <div
              key={r.exerciseId}
              className={`${styles.card} ${i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : ''}`}
            >
              <div className={styles.cardTop}>
                <span className={styles.medal}>{MEDALS[i] ?? `#${i + 1}`}</span>
                <button
                  className={styles.goalBtn}
                  onClick={() => setGoalTarget(r)}
                  title={goal ? 'Изменить цель' : 'Поставить цель'}
                >
                  🎯
                </button>
              </div>
              <button className={styles.cardBody} onClick={() => setSelected(r)} title="Посмотреть прогресс">
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

              {goal && pct !== null && (
                <div className={styles.goalSection}>
                  <div className={styles.goalBar}>
                    <div className={styles.goalFill} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={styles.goalInfo}>
                    <span className={styles.goalPct}>{pct}%</span>
                    <span className={styles.goalTarget}>→ {goal.targetWeight} кг</span>
                    {daysLeft !== null && (
                      <span className={styles.goalDays}>
                        {daysLeft > 0 ? `${daysLeft} дн.` : 'срок истёк'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ExerciseProgressModal
        exerciseId={selected?.exerciseId ?? null}
        exerciseName={selected?.exerciseName ?? ''}
        onClose={() => setSelected(null)}
      />

      <SetGoalModal
        exerciseId={goalTarget?.exerciseId ?? null}
        exerciseName={goalTarget?.exerciseName ?? ''}
        currentGoal={goalTarget ? (goals.find((g) => g.exerciseId === goalTarget.exerciseId) ?? null) : null}
        onClose={() => setGoalTarget(null)}
      />
    </>
  );
}
