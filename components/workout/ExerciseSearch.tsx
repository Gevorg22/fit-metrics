'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import type { Exercise } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';
import { getExerciseImageUrl } from '@/lib/utils';
import styles from './ExerciseSearch.module.scss';

interface Props {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
}

const FAVORITES_LABEL = 'Избранное';

const CATEGORIES: { label: string; muscles: string[] | null }[] = [
  { label: 'Все', muscles: null },
  { label: FAVORITES_LABEL, muscles: null },
  { label: 'Грудь', muscles: ['chest', 'pectorals'] },
  { label: 'Спина', muscles: ['back', 'lats', 'middle back', 'lower back', 'middle_back', 'lower_back', 'upper-back', 'spine'] },
  { label: 'Плечи', muscles: ['shoulders', 'traps', 'delts', 'levator-scapulae', 'serratus-anterior'] },
  { label: 'Бицепс', muscles: ['biceps', 'forearms'] },
  { label: 'Трицепс', muscles: ['triceps'] },
  { label: 'Ноги', muscles: ['quadriceps', 'quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors', 'legs'] },
  { label: 'Пресс', muscles: ['abdominals', 'abs'] },
  { label: 'Кардио', muscles: ['cardio'] },
];

const MUSCLE_RU: Record<string, string> = {
  chest: 'Грудь',
  pectorals: 'Грудь',
  back: 'Спина',
  lats: 'Широчайшие',
  'middle back': 'Средняя спина',
  'lower back': 'Поясница',
  'upper-back': 'Верхняя спина',
  spine: 'Позвоночник',
  shoulders: 'Плечи',
  traps: 'Трапеции',
  biceps: 'Бицепс',
  forearms: 'Предплечья',
  triceps: 'Трицепс',
  quadriceps: 'Квадрицепс',
  quads: 'Квадрицепс',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  calves: 'Икры',
  adductors: 'Приводящие',
  abductors: 'Отводящие',
  abdominals: 'Пресс',
  abs: 'Пресс',
  delts: 'Дельты',
  legs: 'Ноги',
  neck: 'Шея',
  cardio: 'Кардио',
  'levator-scapulae': 'Мышца шеи',
  'serratus-anterior': 'Зубчатая мышца',
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
  const [category, setCategory] = useState<string>(FAVORITES_LABEL);
  const catRowRef = useRef<HTMLDivElement>(null);
  const { favorites, toggle, mounted } = useFavorites();

  const scrollCats = (dir: 'left' | 'right') => {
    if (catRowRef.current) {
      catRowRef.current.scrollBy({ left: dir === 'right' ? 120 : -120, behavior: 'smooth' });
    }
  };

  const filtered = useMemo(() => {
    const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
    const cat = CATEGORIES.find((c) => c.label === category);
    const isFavCat = category === FAVORITES_LABEL;

    const hasCyrillic = (s: string) => /[а-яё]/i.test(s.charAt(0));

    return exercises
      .filter((ex) => {
        if (isFavCat) return favorites.has(ex.id);

        const matchCat =
          !cat?.muscles ||
          ex.primaryMuscles.some((m) => cat.muscles!.includes(m));

        const matchQ =
          words.length === 0 ||
          matchWords(ex.name, words) ||
          (ex.nameRu ? matchWords(ex.nameRu, words) : false);

        return matchCat && matchQ;
      })
      .sort((a, b) => {
        const na = a.nameRu ?? a.name;
        const nb = b.nameRu ?? b.name;
        const ac = hasCyrillic(na);
        const bc = hasCyrillic(nb);
        if (ac !== bc) return ac ? -1 : 1;
        return na.localeCompare(nb, 'ru');
      })
      .slice(0, words.length > 0 ? 500 : category === 'Все' ? 60 : 300);
  }, [exercises, query, category, favorites]);

  return (
    <div className={styles.wrap}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Поиск упражнения..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.catScrollWrap}>
        <button className={`${styles.catArrow} ${styles.catArrowLeft}`} onClick={() => scrollCats('left')} aria-label="Влево">‹</button>
        <div className={styles.catRow} ref={catRowRef}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className={`${styles.catBtn} ${category === cat.label ? styles.catActive : ''} ${cat.label === FAVORITES_LABEL ? styles.catFav : ''}`}
              onClick={() => setCategory(cat.label)}
            >
              {cat.label === FAVORITES_LABEL ? '♥ ' : ''}{cat.label}
            </button>
          ))}
        </div>
        <button className={`${styles.catArrow} ${styles.catArrowRight}`} onClick={() => scrollCats('right')} aria-label="Вправо">›</button>
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 && (
          <p className={styles.empty}>
            {category === FAVORITES_LABEL ? 'Нет избранных упражнений' : 'Ничего не найдено'}
          </p>
        )}
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className={styles.card}
            onClick={() => onSelect(ex)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(ex)}
          >
            {mounted && (
              <button
                className={`${styles.favBtn} ${favorites.has(ex.id) ? styles.favBtnActive : ''}`}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(ex.id); }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                aria-label={favorites.has(ex.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                {favorites.has(ex.id) ? '♥' : '♡'}
              </button>
            )}
            <div className={styles.imgWrap}>
              {ex.images[0] ? (
                <Image
                  src={getExerciseImageUrl(ex.images[0])}
                  alt={ex.nameRu ?? ex.name}
                  width={120}
                  height={120}
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
          </div>
        ))}
      </div>
    </div>
  );
}
