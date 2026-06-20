export const EXERCISE_IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export function getExerciseImageUrl(path: string): string {
  return path.startsWith('http') ? path : EXERCISE_IMG_BASE + path;
}

export function getDuration(start: string, end: string | null): string {
  if (!end) return '';
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  );
  if (mins < 60) return `${mins} мин`;
  return `${Math.floor(mins / 60)}ч ${mins % 60}м`;
}

export function formatSets(sets: { weight: number; reps: number }[]): string {
  return sets.map((s) => `${s.weight}кг×${s.reps}`).join(', ');
}

export function formatVolume(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} млн кг`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} т`;
  return `${kg} кг`;
}

export function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function groupSetsByExercise<T extends { exerciseId: string }>(
  sets: T[]
): { exerciseId: string; sets: T[] }[] {
  const map = new Map<string, T[]>();
  for (const s of sets) {
    if (!map.has(s.exerciseId)) map.set(s.exerciseId, []);
    map.get(s.exerciseId)!.push(s);
  }
  return Array.from(map.entries()).map(([exerciseId, sets]) => ({
    exerciseId,
    sets,
  }));
}
