// Domain model for Workout Session and Set logging
import type { Exercise } from './exercise';

export type SessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export interface SetLog {
    id: string;
    setNumber: number;
    reps: number;
    weight: number; // in user's preferred unit (stored as lbs internally)
    notes?: string;
    loggedAt: Date;
    // Optional advanced tracking fields
    restDuration?: number;  // Rest time in seconds before this set
    rpe?: number;           // Rate of Perceived Exertion (1-10)
    tempo?: string;         // e.g., "3-1-2" (eccentric-pause-concentric)
}

/**
 * Calculate estimated 1RM using Epley formula: weight × (1 + reps/30)
 * Best for 1-10 rep ranges
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
}

/**
 * Find the best (highest estimated 1RM) set from an array
 */
export function findBestSet(sets: SetLog[]): SetLog | null {
    if (sets.length === 0) return null;
    return sets.reduce((best, current) => {
        const best1RM = calculateEstimated1RM(best.weight, best.reps);
        const current1RM = calculateEstimated1RM(current.weight, current.reps);
        return current1RM > best1RM ? current : best;
    });
}

export interface SessionExercise {
    id: string;
    exerciseId: string;
    exercise: Exercise; // Denormalized for display
    orderIndex: number;
    sets: SetLog[];
}

export type WorkoutType = 'upper' | 'lower' | 'legs' | 'push' | 'pull';

export interface WorkoutSession {
    id: string;
    userId: string;
    name: string;
    templateId?: string; // null for ad-hoc workouts
    templateSnapshot?: object; // JSON snapshot of template at creation
    sessionDate: Date;
    status: SessionStatus;
    type?: WorkoutType;
    exercises: SessionExercise[];
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// DTOs for creating/updating

export interface CreateSessionDTO {
    sessionDate: Date;
    name?: string;
    templateId?: string;
    type?: WorkoutType;
}

export interface AddExerciseToSessionDTO {
    exerciseId: string;
}

export interface CreateSetDTO {
    reps: number;
    weight: number;
    notes?: string;
}

export interface UpdateSetDTO {
    reps?: number;
    weight?: number;
    notes?: string;
}

// Computed helpers
export function calculateExerciseVolume(sets: SetLog[]): number {
    return sets.reduce((total, set) => total + set.reps * set.weight, 0);
}

export function calculateSessionVolume(session: WorkoutSession): number {
    return session.exercises.reduce(
        (total, ex) => total + calculateExerciseVolume(ex.sets),
        0
    );
}

export function getNextSetNumber(sets: SetLog[]): number {
    if (sets.length === 0) return 1;
    return Math.max(...sets.map(s => s.setNumber)) + 1;
}
