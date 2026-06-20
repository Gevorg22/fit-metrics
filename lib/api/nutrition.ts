export async function fetchNutritionLog(date: string) {
  const res = await fetch(`/api/nutrition?date=${date}`);
  if (!res.ok) throw new Error('Failed to fetch nutrition log');
  return res.json();
}

export async function addFoodEntry(data: Record<string, unknown>) {
  const res = await fetch('/api/nutrition', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add food entry');
  return res.json();
}

export async function deleteFoodEntry(id: string) {
  const res = await fetch(`/api/nutrition/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete food entry');
}

export async function scanFood(base64: string) {
  const res = await fetch('/api/nutrition/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });
  if (!res.ok) throw new Error('Failed to scan food');
  return res.json();
}

export async function estimateFood(name: string, grams: number) {
  const res = await fetch('/api/nutrition/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, grams }),
  });
  if (!res.ok) throw new Error('Failed to estimate food');
  return res.json();
}
