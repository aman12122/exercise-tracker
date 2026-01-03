// React Query hooks for Exercise operations
// Provides caching, background refresh, and optimistic updates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExerciseService } from '@/services';
import type {
    CreateExerciseDTO,
    UpdateExerciseDTO,
    MuscleGroup
} from '@/domain';
import { useCurrentUserId } from '@/store';

// Query keys for cache management
export const exerciseKeys = {
    all: ['exercises'] as const,
    global: () => [...exerciseKeys.all, 'global'] as const,
    user: (userId: string) => [...exerciseKeys.all, 'user', userId] as const,
    detail: (id: string) => [...exerciseKeys.all, 'detail', id] as const,
    search: (query: string, userId?: string) =>
        [...exerciseKeys.all, 'search', query, userId] as const,
    byMuscleGroup: (muscleGroup: MuscleGroup) =>
        [...exerciseKeys.all, 'muscle', muscleGroup] as const,
};

const exerciseService = getExerciseService();

// Fetch all exercises (global + user)
export function useExercises() {
    return useQuery({
        queryKey: exerciseKeys.all,
        queryFn: () => exerciseService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Fetch only global exercises
export function useGlobalExercises() {
    return useQuery({
        queryKey: exerciseKeys.global(),
        queryFn: () => exerciseService.getGlobalExercises(),
        staleTime: 30 * 60 * 1000, // 30 minutes (rarely changes)
    });
}

// Fetch user-created exercises
export function useUserExercises() {
    const userId = useCurrentUserId();
    return useQuery({
        queryKey: exerciseKeys.user(userId),
        queryFn: () => exerciseService.getUserExercises(userId),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// Fetch a single exercise by ID
export function useExercise(id: string) {
    return useQuery({
        queryKey: exerciseKeys.detail(id),
        queryFn: () => exerciseService.getById(id),
        enabled: !!id,
    });
}

// Search exercises
export function useExerciseSearch(query: string) {
    const userId = useCurrentUserId();
    return useQuery({
        queryKey: exerciseKeys.search(query, userId),
        queryFn: () => exerciseService.search(query, userId),
        enabled: query.length >= 2, // Only search with 2+ characters
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

// Filter by muscle group
export function useExercisesByMuscleGroup(muscleGroup: MuscleGroup | null) {
    return useQuery({
        queryKey: muscleGroup ? exerciseKeys.byMuscleGroup(muscleGroup) : exerciseKeys.all,
        queryFn: () =>
            muscleGroup
                ? exerciseService.filterByMuscleGroup(muscleGroup)
                : exerciseService.getAll(),
        staleTime: 5 * 60 * 1000,
    });
}

// Check for duplicates before creation
export function useDuplicateCheck() {
    const userId = useCurrentUserId();
    return useMutation({
        mutationFn: (name: string) => exerciseService.checkForDuplicates(name, userId),
    });
}

// Create a new exercise
export function useCreateExercise() {
    const queryClient = useQueryClient();
    const userId = useCurrentUserId();

    return useMutation({
        mutationFn: (dto: CreateExerciseDTO) => exerciseService.create(userId, dto),
        onSuccess: (newExercise) => {
            // Invalidate and refetch exercise lists
            queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
            queryClient.invalidateQueries({ queryKey: exerciseKeys.user(userId) });

            // Pre-populate the cache for the new exercise
            queryClient.setQueryData(
                exerciseKeys.detail(newExercise.id),
                newExercise
            );
        },
    });
}

// Update an exercise
export function useUpdateExercise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateExerciseDTO }) =>
            exerciseService.update(id, dto),
        onSuccess: (updatedExercise) => {
            // Update the cache directly
            queryClient.setQueryData(
                exerciseKeys.detail(updatedExercise.id),
                updatedExercise
            );
            // Invalidate lists to reflect changes
            queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
        },
    });
}

// Delete an exercise (soft delete)
export function useDeleteExercise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => exerciseService.delete(id),
        onSuccess: (_data, deletedId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: exerciseKeys.detail(deletedId) });
            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
        },
    });
}
