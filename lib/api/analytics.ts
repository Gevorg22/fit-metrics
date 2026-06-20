import type { PeriodFilter } from '@/types';

export async function fetchStreak() {
  const res = await fetch('/api/analytics/streak');
  if (!res.ok) throw new Error('Failed to fetch streak');
  return res.json() as Promise<{ current: number; longest: number; lastWorkoutDate: string | null }>;
}

export async function fetchAchievements() {
  const res = await fetch('/api/analytics/achievements');
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json() as Promise<
    { id: string; title: string; description: string; icon: string; unlocked: boolean; unlockedAt?: string }[]
  >;
}

export async function fetchMuscleLoad() {
  const res = await fetch('/api/analytics/muscles');
  if (!res.ok) throw new Error('Failed to fetch muscle load');
  return res.json() as Promise<Record<string, number>>;
}

export async function fetchMuscleRecovery() {
  const res = await fetch('/api/analytics/muscle-recovery');
  if (!res.ok) throw new Error('Failed to fetch muscle recovery');
  return res.json() as Promise<Record<string, number>>;
}

export async function fetchMuscleVolume() {
  const res = await fetch('/api/analytics/muscles');
  if (!res.ok) throw new Error('Failed to fetch muscle volume');
  return res.json() as Promise<Record<string, number>>;
}

export async function fetchActivityData() {
  const res = await fetch('/api/analytics/activity');
  if (!res.ok) throw new Error('Failed to fetch activity');
  return res.json() as Promise<Record<string, number>>;
}

export async function fetchWeightChart(period: PeriodFilter) {
  const res = await fetch(`/api/analytics/weight?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch weight chart');
  return res.json() as Promise<{ weight: number; date: string }[]>;
}

export async function fetchLastResult(exerciseId: string, currentWorkoutId?: string) {
  const params = new URLSearchParams({ exerciseId });
  if (currentWorkoutId) params.set('currentWorkoutId', currentWorkoutId);
  const res = await fetch(`/api/analytics/last-result?${params}`);
  if (!res.ok) return null;
  return res.json() as Promise<{ date: string; sets: { setNumber: number; weight: number; reps: number }[] } | null>;
}

export async function fetchExerciseProgress(exerciseId: string) {
  const res = await fetch(`/api/analytics/exercise?exerciseId=${exerciseId}`);
  if (!res.ok) throw new Error('Failed to fetch exercise progress');
  return res.json();
}
