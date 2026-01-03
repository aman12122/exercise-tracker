/**
 * Interface for Exercise History Service
 * Provides progress tracking and analytics capabilities
 */

import type { SetLog } from '@/domain';

export interface ExerciseHistoryEntry {
    sessionId: string;
    sessionDate: Date;
    exerciseId: string;
    exerciseName: string;
    sets: SetLog[];
    totalVolume: number;
    totalReps: number;
    bestSet: SetLog | null;
    estimated1RM: number;
}

export interface ExerciseStats {
    exerciseId: string;
    exerciseName: string;
    prWeight: number;
    prReps: number;
    prDate: Date | null;
    estimated1RM: number;
    totalSessions: number;
    lastPerformed: Date | null;
    totalVolume: number;
}

export interface VolumeAggregate {
    period: string;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    sessionCount: number;
}

export interface DashboardSummary {
    totalWorkouts: number;
    totalVolume: number;
    currentStreak: number;
    longestStreak: number;
    weeklyVolume: number;
    monthlyVolume: number;
    recentWorkouts: Array<{
        date: Date;
        name: string;
        type?: string;
        sessionId: string;
    }>;
    topExercises: Array<{
        exerciseId: string;
        exerciseName: string;
        count: number;
    }>;
}

export interface IExerciseHistoryService {
    /**
     * Get exercise history for a specific exercise
     */
    getExerciseHistory(
        userId: string,
        exerciseId: string,
        limit?: number
    ): Promise<ExerciseHistoryEntry[]>;

    /**
     * Get the last time an exercise was performed
     */
    getLastPerformed(
        userId: string,
        exerciseId: string
    ): Promise<ExerciseHistoryEntry | null>;

    /**
     * Get overall stats for an exercise (PR, total sessions, etc.)
     */
    getExerciseStats(
        userId: string,
        exerciseId: string
    ): Promise<ExerciseStats>;

    /**
     * Get volume aggregated by week or month
     */
    getVolumeByPeriod(
        userId: string,
        periodType: 'week' | 'month',
        startDate?: Date,
        endDate?: Date
    ): Promise<VolumeAggregate[]>;

    /**
     * Get dashboard summary with key metrics
     */
    getDashboardSummary(userId: string): Promise<DashboardSummary>;
}
