'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ExerciseGoal } from '@/types';
import { useSaveGoal, useDeleteGoal } from '@/hooks/useGoals';
import styles from './SetGoalModal.module.scss';

interface Props {
  exerciseId: string | null;
  exerciseName: string;
  currentGoal: ExerciseGoal | null;
  onClose: () => void;
}

export function SetGoalModal({ exerciseId, exerciseName, currentGoal, onClose }: Props) {
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const saveGoal = useSaveGoal();
  const deleteGoal = useDeleteGoal();

  useEffect(() => {
    if (currentGoal) {
      setTargetWeight(String(currentGoal.targetWeight));
      setTargetDate(currentGoal.targetDate);
    } else {
      setTargetWeight('');
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      setTargetDate(d.toISOString().slice(0, 10));
    }
  }, [currentGoal, exerciseId]);

  async function handleSave() {
    if (!exerciseId) return;
    const w = parseFloat(targetWeight);
    if (!w || w <= 0 || !targetDate) {
      messageApi.error('Укажи целевой вес и дату');
      return;
    }
    try {
      await saveGoal.mutateAsync({ exerciseId, exerciseName, targetWeight: w, targetDate });
      messageApi.success('Цель сохранена');
      onClose();
    } catch {
      messageApi.error('Не удалось сохранить');
    }
  }

  async function handleDelete() {
    if (!exerciseId) return;
    try {
      await deleteGoal.mutateAsync(exerciseId);
      messageApi.success('Цель удалена');
      onClose();
    } catch {
      messageApi.error('Не удалось удалить');
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      {contextHolder}
      <Modal
        open={!!exerciseId}
        onCancel={onClose}
        footer={null}
        title={`Цель: ${exerciseName}`}
        width={380}
        styles={{ body: { paddingTop: 16 } }}
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Целевой вес</label>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                type="number"
                min="1"
                max="500"
                step="0.5"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="100"
              />
              <span className={styles.suffix}>кг</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Дата цели</label>
            <input
              className={styles.input}
              type="date"
              min={today}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {currentGoal && (
            <div className={styles.currentProgress}>
              <span className={styles.progressLabel}>Сейчас</span>
              <span className={styles.progressValue}>{currentGoal.currentWeight} кг</span>
              <span className={styles.progressLabel}>из {currentGoal.targetWeight} кг</span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.min(100, Math.round((currentGoal.currentWeight / currentGoal.targetWeight) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className={styles.actions}>
            {currentGoal && (
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleteGoal.isPending}
                onClick={handleDelete}
              >
                Удалить цель
              </Button>
            )}
            <Button
              type="primary"
              loading={saveGoal.isPending}
              onClick={handleSave}
              style={{ marginLeft: 'auto' }}
            >
              {currentGoal ? 'Обновить' : 'Поставить цель'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
