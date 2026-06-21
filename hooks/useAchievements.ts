'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAchievements } from '@/lib/api/analytics';

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAchievements,
    placeholderData: () => [],
  });
}
