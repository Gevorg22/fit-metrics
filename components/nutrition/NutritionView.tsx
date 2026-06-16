'use client';

import { useState, useEffect, useCallback } from 'react';
import { Spin } from 'antd';
import { CalorieNormCard } from './CalorieNormCard';
import { FoodScanner } from './FoodScanner';
import { FoodLog } from './FoodLog';
import { ManualFoodEntry } from './ManualFoodEntry';
import styles from './NutritionView.module.scss';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Props {
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string | null;
  goalWeight: number | null;
  targetCalories: number | null;
  initialEntries: FoodEntry[];
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string): string {
  const today = toLocalDateStr(new Date());
  const yesterday = toLocalDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Сегодня';
  if (dateStr === yesterday) return 'Вчера';
  return new Date(dateStr).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
}

export function NutritionView({ gender, heightCm, weightKg, birthDate, goalWeight, targetCalories, initialEntries }: Props) {
  const todayStr = toLocalDateStr(new Date());
  const [dateStr, setDateStr] = useState(todayStr);
  const [entries, setEntries] = useState<FoodEntry[]>(initialEntries);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const isToday = dateStr === todayStr;

  const loadEntries = useCallback((date: string) => {
    fetch(`/api/nutrition?date=${date}`)
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d.entries) ? d.entries : []))
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false));
  }, []);

  useEffect(() => {
    if (dateStr === todayStr) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingEntries(true);
    loadEntries(dateStr);
  }, [dateStr, todayStr, loadEntries]);

  const goDay = (delta: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + delta);
    const next = toLocalDateStr(d);
    if (next > todayStr) return;
    setDateStr(next);
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleScanAdd = (entry: Omit<FoodEntry, 'id'>) => {
    const tmpId = `tmp-${Date.now()}`;
    setEntries((prev) => [...prev, { ...entry, id: tmpId }]);
    fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, date: dateStr }),
    })
      .then((r) => r.json())
      .then((saved) => setEntries((prev) => prev.map((e) => e.id === tmpId ? saved : e)))
      .catch(() => null);
  };

  const handleManualAdd = (entry: FoodEntry) => {
    setEntries((prev) => [...prev, entry]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h1 className={styles.heading}>Питание</h1>
        <div className={styles.dateNav}>
          <button className={styles.dateBtn} onClick={() => goDay(-1)}>‹</button>
          <span className={styles.dateLabel}>{formatDateLabel(dateStr)}</span>
          <button className={styles.dateBtn} onClick={() => goDay(1)} disabled={isToday}>›</button>
        </div>
      </div>

      <section className={styles.section}>
        <CalorieNormCard
          gender={gender}
          heightCm={heightCm}
          weightKg={weightKg}
          birthDate={birthDate}
          goalWeight={goalWeight}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{isToday ? 'Сегодня съедено' : 'Съедено за день'}</h2>
        {loadingEntries ? (
          <div className={styles.loadingWrap}><Spin /></div>
        ) : (
          <FoodLog
            entries={entries}
            targetCalories={targetCalories}
            onDelete={handleDelete}
          />
        )}
      </section>

      {isToday && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Добавить приём пищи</h2>
          <FoodScanner onAdd={handleScanAdd} />
          <ManualFoodEntry onAdd={handleManualAdd} />
        </section>
      )}
    </div>
  );
}
