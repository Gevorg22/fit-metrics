'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchActivityData } from '@/lib/api/analytics';

export function useActivityData() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: fetchActivityData,
    initialData: {} as Record<string, number>,
  });
}
