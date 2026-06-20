import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGoals, saveGoal, deleteGoal } from '@/lib/api/goals';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    initialData: [],
  });
}

export function useSaveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
