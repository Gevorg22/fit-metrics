'use client';

import styles from './CalorieNormCard.module.scss';

interface Props {
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string | null;
  goalWeight: number | null;
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function calcNorm(gender: string | null, heightCm: number, weightKg: number, age: number): number {
  const isMale = gender !== 'female';
  const bmr = isMale
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return Math.round(bmr * 1.55);
}

export function CalorieNormCard({ gender, heightCm, weightKg, birthDate, goalWeight }: Props) {
  if (!heightCm || !weightKg || !birthDate) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Норма калорий</h3>
        <p className={styles.hint}>Заполни рост, текущий вес и дату рождения в профиле для расчёта</p>
      </div>
    );
  }

  const age = calcAge(birthDate);
  const tdee = calcNorm(gender, heightCm, weightKg, age);

  let goal: 'lose' | 'gain' | 'maintain' = 'maintain';
  let target = tdee;
  let goalLabel = 'Поддержание веса';

  if (goalWeight && goalWeight < weightKg - 0.5) {
    goal = 'lose';
    target = tdee - 400;
    goalLabel = 'Похудение';
  } else if (goalWeight && goalWeight > weightKg + 0.5) {
    goal = 'gain';
    target = tdee + 300;
    goalLabel = 'Набор массы';
  }

  const protein = Math.round(weightKg * (goal === 'gain' ? 2.2 : 1.8));
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Норма калорий</h3>
        <span className={`${styles.goalBadge} ${styles[goal]}`}>{goalLabel}</span>
      </div>

      <div className={styles.mainRow}>
        <div className={styles.mainStat}>
          <span className={styles.mainVal}>{target}</span>
          <span className={styles.mainLabel}>ккал / день</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.tdeeRow}>
          <span className={styles.tdeeLabel}>Поддержание</span>
          <span className={styles.tdeeVal}>{tdee} ккал</span>
        </div>
      </div>

      <div className={styles.macros}>
        <div className={styles.macro}>
          <span className={styles.macroVal}>{protein}г</span>
          <span className={styles.macroLabel}>Белки</span>
        </div>
        <div className={styles.macro}>
          <span className={styles.macroVal}>{fat}г</span>
          <span className={styles.macroLabel}>Жиры</span>
        </div>
        <div className={styles.macro}>
          <span className={styles.macroVal}>{carbs}г</span>
          <span className={styles.macroLabel}>Углеводы</span>
        </div>
      </div>

      <p className={styles.formula}>Формула Миффлина-Сан Жеора · Активность: умеренная</p>
    </div>
  );
}
