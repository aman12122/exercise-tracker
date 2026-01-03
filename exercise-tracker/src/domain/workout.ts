
import type { WorkoutType } from './session';

export interface WorkoutTemplateExercise {
    id: string; // The ID of the exercise in the 'exercises' collection (or simply a reference ID if using a standardized list)
    name: string;
    defaultSets: number;
    defaultReps: number;
    defaultWeight: number | null;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    type: WorkoutType;
    exercises: WorkoutTemplateExercise[];
    createdBy: string; // 'system' | 'user' | 'ai'
    isPublic: boolean;
}

export interface WorkoutCompletion {
    date: string; // YYYY-MM-DD
    type: WorkoutType;
    sessionId: string;
    name: string;
    completedAt: Date;
}
