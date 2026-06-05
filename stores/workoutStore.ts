import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActiveExercise, ActiveSet } from '@/types';

interface WorkoutState {
  workoutId: string | null;
  startedAt: Date | null;
  exercises: ActiveExercise[];

  startWorkout: (workoutId: string) => void;
  finishWorkout: () => void;

  addExercise: (exerciseId: string, exerciseName: string) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string, set: ActiveSet) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, data: { weight: number; reps: number }) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      workoutId: null,
      startedAt: null,
      exercises: [],

      startWorkout: (workoutId) => set({ workoutId, startedAt: new Date(), exercises: [] }),

      finishWorkout: () =>
        set({ workoutId: null, startedAt: null, exercises: [] }),

      addExercise: (exerciseId, exerciseName) =>
        set((state) => {
          if (state.exercises.find((e) => e.exerciseId === exerciseId)) return state;
          return { exercises: [{ exerciseId, exerciseName, sets: [] }, ...state.exercises] };
        }),

      removeExercise: (exerciseId) =>
        set((state) => ({
          exercises: state.exercises.filter((e) => e.exerciseId !== exerciseId),
        })),

      addSet: (exerciseId, newSet) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e
          ),
        })),

      removeSet: (exerciseId, setId) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.exerciseId === exerciseId
              ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
              : e
          ),
        })),

      updateSet: (exerciseId, setId, data) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.exerciseId === exerciseId
              ? {
                  ...e,
                  sets: e.sets.map((s) =>
                    s.id === setId ? { ...s, ...data } : s
                  ),
                }
              : e
          ),
        })),
    }),
    {
      name: 'fitmetrics-workout',
      partialize: (state) => ({
        workoutId: state.workoutId,
        startedAt: state.startedAt,
        exercises: state.exercises,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.startedAt) return;
        const hours = (Date.now() - new Date(state.startedAt).getTime()) / 3_600_000;
        if (hours > 6) {
          state.finishWorkout();
        }
      },
    }
  )
);
