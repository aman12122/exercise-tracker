
import type { WorkoutTemplate, WorkoutCompletion } from '@/domain';

export interface IWorkoutService {
    /**
     * Get all workout templates for a user
     */
    getTemplates(userId: string): Promise<WorkoutTemplate[]>;

    /**
     * Get AI suggested workouts (mocked)
     */
    getSuggestedWorkouts(userId: string): Promise<WorkoutTemplate[]>;

    /**
     * Seed default templates for a user if none exist
     */
    seedTemplates(userId: string): Promise<void>;

    /**
     * Get workout completions for a specific month
     * @param month 0-indexed month (0 = Jan, 11 = Dec)
     */
    getCompletionsForMonth(userId: string, year: number, month: number): Promise<WorkoutCompletion[]>;
}
