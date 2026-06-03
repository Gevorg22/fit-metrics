'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Exercise } from '@/types';
import styles from './ExerciseSearch.module.scss';

interface Props {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
}

const CATEGORIES: { label: string; muscles: string[] | null }[] = [
  { label: 'Все', muscles: null },
  { label: 'Грудь', muscles: ['chest'] },
  { label: 'Спина', muscles: ['back', 'lats', 'middle back', 'lower back'] },
  { label: 'Плечи', muscles: ['shoulders', 'traps'] },
  { label: 'Бицепс', muscles: ['biceps', 'forearms'] },
  { label: 'Трицепс', muscles: ['triceps'] },
  { label: 'Ноги', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors', 'legs'] },
  { label: 'Пресс', muscles: ['abdominals'] },
];

const MUSCLE_RU: Record<string, string> = {
  chest: 'Грудь',
  back: 'Спина',
  lats: 'Широчайшие',
  'middle back': 'Средняя спина',
  'lower back': 'Поясница',
  shoulders: 'Плечи',
  traps: 'Трапеции',
  biceps: 'Бицепс',
  forearms: 'Предплечья',
  triceps: 'Трицепс',
  quadriceps: 'Квадрицепс',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  calves: 'Икры',
  adductors: 'Приводящие',
  abductors: 'Отводящие',
  abdominals: 'Пресс',
  legs: 'Ноги',
  neck: 'Шея',
};

function normalize(str: string) {
  return str.toLowerCase().replace(/ё/g, 'е');
}

function matchWords(text: string, words: string[]): boolean {
  const norm = normalize(text);
  return words.every((w) => norm.includes(w));
}

export function ExerciseSearch({ exercises, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('Все');

  const filtered = useMemo(() => {
    const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
    const cat = CATEGORIES.find((c) => c.label === category);

    return exercises
      .filter((ex) => {
        const matchCat =
          !cat?.muscles ||
          ex.primaryMuscles.some((m) => cat.muscles!.includes(m));

        const matchQ =
          words.length === 0 ||
          matchWords(ex.name, words) ||
          (ex.nameRu ? matchWords(ex.nameRu, words) : false);

        return matchCat && matchQ;
      })
      .slice(0, 40);
  }, [exercises, query, category]);

  return (
    <div className={styles.wrap}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Поиск упражнения..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            className={`${styles.catBtn} ${category === cat.label ? styles.catActive : ''}`}
            onClick={() => setCategory(cat.label)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 && (
          <p className={styles.empty}>Ничего не найдено</p>
        )}
        {filtered.map((ex) => (
          <button
            key={ex.id}
            className={styles.card}
            onClick={() => onSelect(ex)}
          >
            <div className={styles.imgWrap}>
              {ex.images[0] ? (
                <Image
                  src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}`}
                  alt={ex.nameRu ?? ex.name}
                  width={80}
                  height={80}
                  className={styles.img}
                  unoptimized
                />
              ) : (
                <div className={styles.imgPlaceholder} />
              )}
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardName}>{ex.nameRu ?? ex.name}</span>
              <span className={styles.cardMuscle}>
                {MUSCLE_RU[ex.primaryMuscles[0]] ?? ex.primaryMuscles[0]}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
