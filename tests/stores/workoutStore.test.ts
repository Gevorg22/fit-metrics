import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutStore } from '@/stores/workoutStore';

const reset = () =>
  useWorkoutStore.setState({ workoutId: null, startedAt: null, exercises: [] });

describe('workoutStore', () => {
  beforeEach(reset);

  describe('startWorkout', () => {
    it('sets workoutId and startedAt', () => {
      useWorkoutStore.getState().startWorkout('workout-1');
      const { workoutId, startedAt, exercises } = useWorkoutStore.getState();
      expect(workoutId).toBe('workout-1');
      expect(startedAt).toBeInstanceOf(Date);
      expect(exercises).toEqual([]);
    });

    it('clears exercises when starting a new workout', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().startWorkout('workout-2');
      expect(useWorkoutStore.getState().exercises).toEqual([]);
    });
  });

  describe('finishWorkout', () => {
    it('resets all state to null/empty', () => {
      useWorkoutStore.getState().startWorkout('workout-1');
      useWorkoutStore.getState().finishWorkout();
      const { workoutId, startedAt, exercises } = useWorkoutStore.getState();
      expect(workoutId).toBeNull();
      expect(startedAt).toBeNull();
      expect(exercises).toEqual([]);
    });
  });

  describe('addExercise', () => {
    it('adds an exercise to the list', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      const { exercises } = useWorkoutStore.getState();
      expect(exercises).toHaveLength(1);
      expect(exercises[0]).toMatchObject({ exerciseId: 'ex-1', exerciseName: 'Push Up', sets: [] });
    });

    it('prepends new exercise to the front', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().addExercise('ex-2', 'Squat');
      expect(useWorkoutStore.getState().exercises[0].exerciseId).toBe('ex-2');
    });

    it('does not add a duplicate exercise', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      expect(useWorkoutStore.getState().exercises).toHaveLength(1);
    });
  });

  describe('removeExercise', () => {
    it('removes the specified exercise', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().addExercise('ex-2', 'Squat');
      useWorkoutStore.getState().removeExercise('ex-1');
      const { exercises } = useWorkoutStore.getState();
      expect(exercises).toHaveLength(1);
      expect(exercises[0].exerciseId).toBe('ex-2');
    });

    it('does nothing when exerciseId not found', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().removeExercise('not-found');
      expect(useWorkoutStore.getState().exercises).toHaveLength(1);
    });
  });

  describe('addSet', () => {
    it('adds a set to the correct exercise', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().addSet('ex-1', {
        id: 'set-1',
        exerciseId: 'ex-1',
        setNumber: 1,
        weight: 50,
        reps: 10,
      });
      const sets = useWorkoutStore.getState().exercises[0].sets;
      expect(sets).toHaveLength(1);
      expect(sets[0]).toMatchObject({ id: 'set-1', weight: 50, reps: 10 });
    });

    it('does not add set to a different exercise', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().addExercise('ex-2', 'Squat');
      useWorkoutStore.getState().addSet('ex-1', {
        id: 'set-1',
        exerciseId: 'ex-1',
        setNumber: 1,
        weight: 50,
        reps: 10,
      });
      const squat = useWorkoutStore.getState().exercises.find((e) => e.exerciseId === 'ex-2');
      expect(squat?.sets).toHaveLength(0);
    });
  });

  describe('removeSet', () => {
    it('removes the correct set from an exercise', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().addSet('ex-1', { id: 'set-1', exerciseId: 'ex-1', setNumber: 1, weight: 50, reps: 10 });
      useWorkoutStore.getState().addSet('ex-1', { id: 'set-2', exerciseId: 'ex-1', setNumber: 2, weight: 60, reps: 8 });
      useWorkoutStore.getState().removeSet('ex-1', 'set-1');
      const sets = useWorkoutStore.getState().exercises[0].sets;
      expect(sets).toHaveLength(1);
      expect(sets[0].id).toBe('set-2');
    });
  });

  describe('updateSet', () => {
    it('updates weight and reps for the specified set', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().addSet('ex-1', { id: 'set-1', exerciseId: 'ex-1', setNumber: 1, weight: 50, reps: 10 });
      useWorkoutStore.getState().updateSet('ex-1', 'set-1', { weight: 75, reps: 5 });
      const set = useWorkoutStore.getState().exercises[0].sets[0];
      expect(set.weight).toBe(75);
      expect(set.reps).toBe(5);
    });

    it('does not modify other sets', () => {
      useWorkoutStore.getState().addExercise('ex-1', 'Push Up');
      useWorkoutStore.getState().addSet('ex-1', { id: 'set-1', exerciseId: 'ex-1', setNumber: 1, weight: 50, reps: 10 });
      useWorkoutStore.getState().addSet('ex-1', { id: 'set-2', exerciseId: 'ex-1', setNumber: 2, weight: 60, reps: 8 });
      useWorkoutStore.getState().updateSet('ex-1', 'set-1', { weight: 75, reps: 5 });
      const set2 = useWorkoutStore.getState().exercises[0].sets[1];
      expect(set2.weight).toBe(60);
      expect(set2.reps).toBe(8);
    });
  });
});
