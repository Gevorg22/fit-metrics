'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Popconfirm, message, Spin } from 'antd';
import { CheckOutlined, PlusOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import { useWorkoutStore } from '@/stores/workoutStore';
import { SetForm } from '@/components/workout/SetForm';
import { WorkoutTemplates } from '@/components/workout/WorkoutTemplates';
import type { Exercise, ActiveSet, TemplateExercise } from '@/types';
import styles from './page.module.scss';

const ExerciseSearch = dynamic(
  () => import('@/components/workout/ExerciseSearch').then((m) => ({ default: m.ExerciseSearch })),
  { ssr: false, loading: () => <div className={styles.searchLoading}><Spin /></div> }
);

export default function WorkoutPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [finishing, setFinishing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notes, setNotes] = useState('');

  const {
    workoutId,
    startedAt,
    exercises: activeExercises,
    startWorkout,
    finishWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
  } = useWorkoutStore();

  useEffect(() => {
    fetch('/api/exercises')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setExercises(data);
      })
      .catch(() => {});
  }, []);

  const isGuest = typeof document !== 'undefined'
    ? document.cookie.includes('fitmetrics-guest=1')
    : false;

  const handleStart = async () => {
    if (isGuest) {
      startWorkout(`guest-${Date.now()}`);
      return;
    }
    setStarting(true);
    try {
      const res = await fetch('/api/workout', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.id) throw new Error('No workout id');
      startWorkout(data.id);
    } catch (e) {
      console.error('Workout start error:', e);
      messageApi.error('Не удалось создать тренировку. Проверь соединение.');
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = async () => {
    if (!workoutId) return;
    setCancelling(true);
    try {
      if (!isGuest) {
        await fetch(`/api/workout/${workoutId}`, { method: 'DELETE' });
      }
      finishWorkout();
      router.push('/dashboard');
    } catch {
      messageApi.error('Не удалось отменить тренировку');
    } finally {
      setCancelling(false);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    const already = activeExercises.find((e) => e.exerciseId === exercise.id);
    if (already) {
      messageApi.info('Упражнение уже добавлено');
    } else {
      addExercise(exercise.id, exercise.nameRu ?? exercise.name);
    }
    setShowSearch(false);
  };

  const handleSetAdded = (exerciseId: string, set: ActiveSet) => {
    addSet(exerciseId, set);
  };

  const handleSetRemoved = (exerciseId: string, setId: string) => {
    removeSet(exerciseId, setId);
  };

  const handleLoadTemplate = (templateExercises: TemplateExercise[]) => {
    for (const ex of templateExercises) {
      addExercise(ex.exerciseId, ex.exerciseName);
    }
    messageApi.success('Шаблон загружен');
  };

  const handleFinish = async () => {
    if (!workoutId) return;
    const hasSets = activeExercises.some((ex) => ex.sets.length > 0);
    if (!hasSets) {
      messageApi.warning('Добавь хотя бы один подход перед завершением');
      return;
    }
    setFinishing(true);
    try {
      await fetch(`/api/workout/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finishedAt: new Date().toISOString(),
          notes: notes.trim() || null,
        }),
      });
      finishWorkout();
      messageApi.success('Тренировка завершена!');
      router.push('/dashboard');
    } catch {
      messageApi.error('Ошибка завершения тренировки');
    } finally {
      setFinishing(false);
    }
  };

  const [duration, setDuration] = useState(0);
  useEffect(() => {
    if (!startedAt) { setDuration(0); return; }
    const calc = () => Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    setDuration(calc());
    const id = setInterval(() => setDuration(calc()), 10000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!workoutId) {
    return (
      <div className={styles.startScreen}>
        {contextHolder}
        <div className={styles.startCard}>
          <h3 className={styles.startTitle}>Начать тренировку</h3>
          <p className={styles.startDesc}>
            Создай тренировку, добавляй упражнения и фиксируй подходы.
          </p>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleStart} loading={starting}>
            Начать
          </Button>
        </div>
        <div className={styles.startTemplates}>
          <WorkoutTemplates
            activeExercises={[]}
            onLoad={async (exs) => {
              await handleStart();
              handleLoadTemplate(exs);
            }}
            isGuest={isGuest}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {contextHolder}

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h4 className={styles.toolbarTitle}>Тренировка</h4>
          <span className={styles.duration}>{duration} мин</span>
        </div>
        <div className={styles.toolbarRight}>
          <Popconfirm
            title="Отменить тренировку?"
            description="Все записанные подходы будут удалены без сохранения."
            onConfirm={handleCancel}
            okText="Отменить"
            cancelText="Назад"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<CloseOutlined />}
              loading={cancelling}
              danger
            >
              Отменить
            </Button>
          </Popconfirm>

          {isGuest ? (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => router.push('/login')}
              title="Войди в аккаунт, чтобы сохранять тренировки"
            >
              Войти и сохранить
            </Button>
          ) : (
            <Popconfirm
              title="Завершить тренировку?"
              description="Все записанные подходы уже сохранены."
              onConfirm={handleFinish}
              okText="Завершить"
              cancelText="Отмена"
            >
              <Button type="primary" icon={<CheckOutlined />} loading={finishing}>
                Завершить
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {isGuest && (
        <div className={styles.guestBanner}>
          Гостевой режим — тренировки не сохраняются.{' '}
          <button className={styles.guestLoginLink} onClick={() => router.push('/login')}>
            Войти в аккаунт
          </button>
        </div>
      )}

      {!isGuest && (
        <div className={styles.notesWrap}>
          <textarea
            className={styles.notesInput}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Заметка к тренировке (необязательно)..."
            rows={2}
            maxLength={500}
          />
        </div>
      )}

      <WorkoutTemplates
        activeExercises={activeExercises.map((e) => ({ exerciseId: e.exerciseId, exerciseName: e.exerciseName }))}
        onLoad={handleLoadTemplate}
        isGuest={isGuest}
      />

      <div className={styles.addExerciseRow}>
        <button
          className={`${styles.addExerciseBtn} ${showSearch ? styles.addExerciseBtnActive : ''}`}
          onClick={() => setShowSearch((v) => !v)}
        >
          <PlusOutlined />
          {showSearch ? 'Скрыть поиск' : 'Добавить упражнение'}
        </button>
      </div>

      {showSearch && (
        <div className={styles.searchCard}>
          <ExerciseSearch exercises={exercises} onSelect={handleSelectExercise} />
        </div>
      )}

      {activeExercises.length === 0 ? (
        <p className={styles.empty}>Нажми «Добавить упражнение» и выбери из списка</p>
      ) : (
        <div className={styles.exerciseList}>
          {activeExercises.map((ex) => (
            <div key={ex.exerciseId} className={styles.exerciseCard}>
              <div className={styles.exerciseHeader}>
                <div className={styles.exerciseLeft}>
                  <span className={styles.exerciseName}>{ex.exerciseName}</span>
                  <span className={styles.setsCount}>{ex.sets.length} подх.</span>
                </div>
                <Popconfirm
                  title="Удалить упражнение?"
                  onConfirm={() => removeExercise(ex.exerciseId)}
                  okText="Да"
                  cancelText="Нет"
                >
                  <button className={styles.removeBtn}>
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>
              <div className={styles.exerciseBody}>
                <SetForm
                  workoutId={workoutId}
                  exercise={ex}
                  isGuest={isGuest}
                  onSetAdded={(set) => handleSetAdded(ex.exerciseId, set)}
                  onSetRemoved={(setId) => handleSetRemoved(ex.exerciseId, setId)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
