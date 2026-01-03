/**
 * React Query hooks for Exercise History and Progress Tracking
 * Provides caching and automatic refetching for progress data
 */

import { useQuery } from '@tanstack/react-query';
import { getExerciseHistoryService } from '@/services';
import { useCurrentUserId } from '@/store';

// Query keys for cache management
export const historyKeys = {
    all: ['exerciseHistory'] as const,
    exercise: (userId: string, exerciseId: string) =>
        [...historyKeys.all, 'exercise', userId, exerciseId] as const,
    exerciseStats: (userId: string, exerciseId: string) =>
        [...historyKeys.all, 'stats', userId, exerciseId] as const,
    lastPerformed: (userId: string, exerciseId: string) =>
        [...historyKeys.all, 'lastPerformed', userId, exerciseId] as const,
    volume: (userId: string, periodType: string) =>
        [...historyKeys.all, 'volume', userId, periodType] as const,
    dashboard: (userId: string) =>
        [...historyKeys.all, 'dashboard', userId] as const,
};

const historyService = getExerciseHistoryService();

/**
 * Get exercise history for a specific exercise
 */
export function useExerciseHistory(exerciseId: string, limit?: number) {
    const userId = useCurrentUserId();

    return useQuery({
        queryKey: historyKeys.exercise(userId, exerciseId),
        queryFn: () => historyService.getExerciseHistory(userId, exerciseId, limit),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!exerciseId,
    });
}

/**
 * Get the last time an exercise was performed
 */
export function useLastPerformed(exerciseId: string) {
    const userId = useCurrentUserId();

    return useQuery({
        queryKey: historyKeys.lastPerformed(userId, exerciseId),
        queryFn: () => historyService.getLastPerformed(userId, exerciseId),
        staleTime: 5 * 60 * 1000,
        enabled: !!exerciseId,
    });
}

/**
 * Get overall stats for an exercise (PR, volume, etc.)
 */
export function useExerciseStats(exerciseId: string) {
    const userId = useCurrentUserId();

    return useQuery({
        queryKey: historyKeys.exerciseStats(userId, exerciseId),
        queryFn: () => historyService.getExerciseStats(userId, exerciseId),
        staleTime: 5 * 60 * 1000,
        enabled: !!exerciseId,
    });
}

/**
 * Get volume aggregated by week or month
 */
export function useVolumeByPeriod(
    periodType: 'week' | 'month',
    startDate?: Date,
    endDate?: Date
) {
    const userId = useCurrentUserId();

    return useQuery({
        queryKey: historyKeys.volume(userId, periodType),
        queryFn: () => historyService.getVolumeByPeriod(
            userId,
            periodType,
            startDate,
            endDate
        ),
        staleTime: 10 * 60 * 1000, // 10 minutes - aggregates change less frequently
    });
}

/**
 * Get dashboard summary with key metrics
 */
export function useDashboardSummary() {
    const userId = useCurrentUserId();

    return useQuery({
        queryKey: historyKeys.dashboard(userId),
        queryFn: () => historyService.getDashboardSummary(userId),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}
