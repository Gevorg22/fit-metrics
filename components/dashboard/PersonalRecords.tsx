import styles from './PersonalRecords.module.scss';

interface PREntry {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number | null;
}

interface Props {
  records: PREntry[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function PersonalRecords({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🏆</span>
        <span className={styles.emptyText}>Запиши первую тренировку — здесь появятся твои рекорды</span>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {records.map((r, i) => (
        <div key={r.exerciseId} className={`${styles.card} ${i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : ''}`}>
          <span className={styles.medal}>{MEDALS[i] ?? `#${i + 1}`}</span>
          <span className={styles.name}>{r.exerciseName}</span>
          <div className={styles.result}>
            <span className={styles.weight}>{r.maxWeight}</span>
            <span className={styles.unit}>кг</span>
          </div>
          {r.maxReps && (
            <span className={styles.reps}>× {r.maxReps} повт.</span>
          )}
        </div>
      ))}
    </div>
  );
}
