'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { ThunderboltOutlined, LoadingOutlined } from '@ant-design/icons';
import { useWorkoutStore } from '@/stores/workoutStore';
import styles from './WorkoutCTA.module.scss';

export function WorkoutCTA() {
  const workoutId = useWorkoutStore((s) => s.workoutId);
  const inProgress = Boolean(workoutId);

  return (
    <div className={`${styles.ctaCard} ${inProgress ? styles.active : ''}`}>
      <div className={styles.ctaText}>
        <span className={styles.ctaTitle}>
          {inProgress ? 'Тренировка идёт...' : 'Готов к тренировке?'}
        </span>
        <span className={styles.ctaSub}>
          {inProgress
            ? 'Вернись и продолжи фиксировать подходы'
            : 'Выбери упражнение и фиксируй подходы'}
        </span>
      </div>
      <Link href="/workout">
        <Button
          type="primary"
          size="large"
          icon={inProgress ? <LoadingOutlined /> : <ThunderboltOutlined />}
          className={inProgress ? styles.activeBtn : ''}
        >
          {inProgress ? 'Продолжить' : 'Начать тренировку'}
        </Button>
      </Link>
    </div>
  );
}
