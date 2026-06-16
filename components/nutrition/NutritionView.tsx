'use client';

import { useState } from 'react';
import { CalorieNormCard } from './CalorieNormCard';
import { FoodScanner } from './FoodScanner';
import { FoodLog } from './FoodLog';
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

export function NutritionView({ gender, heightCm, weightKg, birthDate, goalWeight, targetCalories, initialEntries }: Props) {
  const [entries, setEntries] = useState<FoodEntry[]>(initialEntries);

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Питание</h1>

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
        <h2 className={styles.sectionTitle}>Сегодня съедено</h2>
        <FoodLog
          entries={entries}
          targetCalories={targetCalories}
          onDelete={handleDelete}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Добавить приём пищи</h2>
        <FoodScanner onAdd={(entry) => {
          setEntries((prev) => [...prev, { ...entry, id: `tmp-${Date.now()}` }]);
          fetch('/api/nutrition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          })
            .then((r) => r.json())
            .then((saved) => setEntries((prev) =>
              prev.map((e) => e.id.startsWith('tmp-') && e.name === saved.name ? saved : e)
            ))
            .catch(() => null);
        }} />
      </section>
    </div>
  );
}
