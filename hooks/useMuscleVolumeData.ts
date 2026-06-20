'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMuscleVolume } from '@/lib/api/analytics';

export function useMuscleVolumeData() {
  return useQuery({
    queryKey: ['muscle-load'],
    queryFn: fetchMuscleVolume,
    initialData: {} as Record<string, number>,
  });
}
