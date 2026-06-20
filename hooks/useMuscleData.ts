'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMuscleLoad, fetchMuscleRecovery } from '@/lib/api/analytics';

export function useMuscleLoad() {
  return useQuery({
    queryKey: ['muscle-load'],
    queryFn: fetchMuscleLoad,
    initialData: {} as Record<string, number>,
  });
}

export function useMuscleRecovery() {
  return useQuery({
    queryKey: ['muscle-recovery'],
    queryFn: fetchMuscleRecovery,
    initialData: {} as Record<string, number>,
  });
}
