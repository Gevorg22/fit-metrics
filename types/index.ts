export interface Exercise {
  id: string;
  name: string;
  nameRu?: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  images: string[];
}

export interface WorkoutSetInput {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
}

export interface ActiveSet extends WorkoutSetInput {
  id?: string;
  savedAt?: Date;
}

export interface ActiveExercise {
  exerciseId: string;
  exerciseName: string;
  sets: ActiveSet[];
}

export interface WeightLogEntry {
  id: string;
  weight: number;
  date: string;
}

export interface WorkoutSetEntry {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
}

export interface WorkoutHistoryEntry {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  notes?: string | null;
  sets: WorkoutSetEntry[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number | null;
}

export interface WorkoutDay {
  date: string;
  count: number;
}

export type PeriodFilter = '1m' | '3m' | '1y';
