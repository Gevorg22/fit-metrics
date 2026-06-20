export async function patchProfile(data: Record<string, unknown>) {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
}

export async function fetchProfile() {
  const res = await fetch('/api/profile');
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}
