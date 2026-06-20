export async function deleteWorkout(id: string) {
  const res = await fetch(`/api/workout/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete workout');
}

export async function createWorkout() {
  const res = await fetch('/api/workout', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create workout');
  return res.json();
}

export async function addSet(
  workoutId: string,
  data: { exerciseId: string; setNumber: number; weight: number; reps: number }
) {
  const res = await fetch(`/api/workout/${workoutId}/sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add set');
  return res.json();
}

export async function updateSet(
  workoutId: string,
  setId: string,
  data: { weight: number; reps: number }
) {
  const res = await fetch(`/api/workout/${workoutId}/sets/${setId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update set');
}

export async function deleteSet(workoutId: string, setId: string) {
  const res = await fetch(`/api/workout/${workoutId}/sets/${setId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete set');
}

export async function fetchHistory(params?: { cursor?: string; exerciseId?: string }) {
  const query = new URLSearchParams();
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.exerciseId) query.set('exerciseId', params.exerciseId);
  const res = await fetch(`/api/history?${query}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}
