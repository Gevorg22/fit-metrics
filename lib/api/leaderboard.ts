export async function fetchLeaderboard() {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function fetchUserStats(userId: string) {
  const res = await fetch(`/api/leaderboard/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user stats');
  return res.json();
}
