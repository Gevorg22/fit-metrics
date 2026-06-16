'use client';

import { useState } from 'react';
import { Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import styles from './FoodLog.module.scss';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Props {
  entries: FoodEntry[];
  targetCalories: number | null;
  onDelete: (id: string) => void;
}

export function FoodLog({ entries, targetCalories, onDelete }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalCal = entries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + e.protein, 0);
  const totalFat = entries.reduce((s, e) => s + e.fat, 0);
  const totalCarbs = entries.reduce((s, e) => s + e.carbs, 0);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/nutrition/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      onDelete(id);
    } catch {
      messageApi.error('Ошибка удаления');
    } finally {
      setDeleting(null);
    }
  };

  const progress = targetCalories ? Math.min((totalCal / targetCalories) * 100, 100) : null;
  const remaining = targetCalories ? targetCalories - totalCal : null;

  return (
    <div className={styles.wrap}>
      {contextHolder}

      <div className={styles.summary}>
        <div className={styles.summaryMain}>
          <span className={styles.summaryVal}>{totalCal}</span>
          <span className={styles.summaryLabel}>ккал сегодня</span>
        </div>
        {remaining !== null && (
          <div className={`${styles.remaining} ${remaining < 0 ? styles.over : ''}`}>
            {remaining >= 0 ? `ещё ${remaining} ккал` : `+${Math.abs(remaining)} ккал сверх нормы`}
          </div>
        )}
        {progress !== null && (
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${progress >= 100 ? styles.progressOver : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className={styles.macroRow}>
          <span>Б: {Math.round(totalProtein)}г</span>
          <span>Ж: {Math.round(totalFat)}г</span>
          <span>У: {Math.round(totalCarbs)}г</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className={styles.empty}>Записей пока нет — сфотографируй еду или добавь вручную</p>
      ) : (
        <div className={styles.list}>
          {entries.map((e) => (
            <div key={e.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{e.name}</span>
                <span className={styles.itemMacros}>
                  {e.calories} ккал · Б{Math.round(e.protein)}г · Ж{Math.round(e.fat)}г · У{Math.round(e.carbs)}г
                </span>
              </div>
              <Popconfirm
                title="Удалить запись?"
                onConfirm={() => handleDelete(e.id)}
                okText="Да"
                cancelText="Нет"
                okButtonProps={{ danger: true }}
              >
                <button
                  className={styles.deleteBtn}
                  disabled={deleting === e.id}
                  aria-label="Удалить"
                >
                  <DeleteOutlined />
                </button>
              </Popconfirm>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
