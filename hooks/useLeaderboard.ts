'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard, fetchUserStats } from '@/lib/api/leaderboard';

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  });
}

export function useUserStats(userId: string | null) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => fetchUserStats(userId!),
    enabled: !!userId,
  });
}
