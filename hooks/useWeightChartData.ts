'use client';

import { useQuery } from '@tanstack/react-query';
import type { PeriodFilter } from '@/types';
import { fetchWeightChart } from '@/lib/api/analytics';

export function useWeightChartData(period: PeriodFilter, refreshKey?: number) {
  return useQuery({
    queryKey: ['weight-chart', period, refreshKey],
    queryFn: () => fetchWeightChart(period),
    placeholderData: () => [],
  });
}
