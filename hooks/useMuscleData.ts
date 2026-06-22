'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMuscleLoad, fetchMuscleRecovery } from '@/lib/api/analytics';

export function useMuscleLoad() {
  return useQuery({
    queryKey: ['muscle-load'],
    queryFn: fetchMuscleLoad,
    placeholderData: () => ({} as Record<string, number>),
    staleTime: 0,
  });
}

export function useMuscleRecovery() {
  return useQuery({
    queryKey: ['muscle-recovery'],
    queryFn: fetchMuscleRecovery,
    placeholderData: () => ({} as Record<string, number>),
    staleTime: 0,
  });
}
