'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStreak } from '@/lib/api/analytics';

export function useStreak() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: fetchStreak,
  });
}
