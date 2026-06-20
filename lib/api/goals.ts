import type { ExerciseGoal } from '@/types';

export async function fetchGoals(): Promise<ExerciseGoal[]> {
  const res = await fetch('/api/goals');
  if (!res.ok) throw new Error('Failed to fetch goals');
  return res.json();
}

export async function saveGoal(data: {
  exerciseId: string;
  exerciseName: string;
  targetWeight: number;
  targetDate: string;
}): Promise<void> {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save goal');
}

export async function deleteGoal(exerciseId: string): Promise<void> {
  const res = await fetch(`/api/goals?exerciseId=${exerciseId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete goal');
}
