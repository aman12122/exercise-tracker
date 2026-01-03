// React Query hooks for Workout Session operations
// Handles session lifecycle, exercise management, and set logging

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessionService } from '@/services';
import type {
    WorkoutSession,
    CreateSessionDTO,
    CreateSetDTO,
    UpdateSetDTO,
} from '@/domain';
import { useCurrentUserId } from '@/store';

// Query keys for cache management
export const sessionKeys = {
    all: ['sessions'] as const,
    forUser: (userId: string) => [...sessionKeys.all, 'user', userId] as const,
    detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
    byDate: (userId: string, date: string) =>
        [...sessionKeys.all, 'date', userId, date] as const,
    range: (userId: string, start: string, end: string) =>
        [...sessionKeys.all, 'range', userId, start, end] as const,
    active: (userId: string) => [...sessionKeys.all, 'active', userId] as const,
};

const sessionService = getSessionService();

// Get all sessions for current user
export function useSessions() {
    const userId = useCurrentUserId();
    return useQuery({
        queryKey: sessionKeys.forUser(userId),
        queryFn: () => sessionService.getAllForUser(userId),
        staleTime: 2 * 60 * 1000,
    });
}

// Get session by ID
export function useSession(id: string | null) {
    return useQuery({
        queryKey: id ? sessionKeys.detail(id) : ['empty'],
        queryFn: () => (id ? sessionService.getById(id) : null),
        enabled: !!id,
        staleTime: 30 * 1000, // 30 seconds - sessions change frequently during workout
    });
}

// Get session by date
export function useSessionByDate(date: Date) {
    const userId = useCurrentUserId();
    const dateStr = date.toISOString().split('T')[0];
    return useQuery({
        queryKey: sessionKeys.byDate(userId, dateStr),
        queryFn: () => sessionService.getByDate(userId, date),
        staleTime: 2 * 60 * 1000,
    });
}

// Get sessions by date range
export function useSessionsRange(startDate: Date, endDate: Date) {
    const userId = useCurrentUserId();
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    return useQuery({
        queryKey: sessionKeys.range(userId, startStr, endStr),
        queryFn: () => sessionService.getSessionsByDateRange(userId, startDate, endDate),
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
    } as any); // Type cast if needed for keepPreviousData dependent on v5
}

// Get active (in-progress) session
export function useActiveSession() {
    const userId = useCurrentUserId();
    return useQuery({
        queryKey: sessionKeys.active(userId),
        queryFn: () => sessionService.getActiveSession(userId),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000, // Poll every minute for active sessions
    });
}

// Create a new session
export function useCreateSession() {
    const queryClient = useQueryClient();
    const userId = useCurrentUserId();

    return useMutation({
        mutationFn: (dto: CreateSessionDTO) => sessionService.create(userId, dto),
        onSuccess: (newSession) => {
            queryClient.invalidateQueries({ queryKey: sessionKeys.forUser(userId) });
            queryClient.setQueryData(sessionKeys.detail(newSession.id), newSession);
        },
    });
}

// Start a session (not_started -> in_progress)
export function useStartSession() {
    const queryClient = useQueryClient();
    const userId = useCurrentUserId();

    return useMutation({
        mutationFn: (sessionId: string) => sessionService.startSession(sessionId),
        onSuccess: (updatedSession) => {
            queryClient.setQueryData(
                sessionKeys.detail(updatedSession.id),
                updatedSession
            );
            queryClient.invalidateQueries({ queryKey: sessionKeys.active(userId) });
        },
    });
}

// Complete a session (in_progress -> completed)
export function useCompleteSession() {
    const queryClient = useQueryClient();
    const userId = useCurrentUserId();

    return useMutation({
        mutationFn: (sessionId: string) => sessionService.completeSession(sessionId),
        onSuccess: (updatedSession) => {
            queryClient.setQueryData(
                sessionKeys.detail(updatedSession.id),
                updatedSession
            );
            queryClient.invalidateQueries({ queryKey: sessionKeys.active(userId) });
            queryClient.invalidateQueries({ queryKey: sessionKeys.forUser(userId) });
        },
    });
}

// Abandon a session
export function useAbandonSession() {
    const queryClient = useQueryClient();
    const userId = useCurrentUserId();

    return useMutation({
        mutationFn: (sessionId: string) => sessionService.abandonSession(sessionId),
        onSuccess: (updatedSession) => {
            queryClient.setQueryData(
                sessionKeys.detail(updatedSession.id),
                updatedSession
            );
            queryClient.invalidateQueries({ queryKey: sessionKeys.active(userId) });
        },
    });
}

// Add an exercise to a session
export function useAddExerciseToSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sessionId,
            exerciseId,
        }: {
            sessionId: string;
            exerciseId: string;
        }) => sessionService.addExercise(sessionId, exerciseId),
        onSuccess: (_newExercise, { sessionId }) => {
            // Refetch the session to get updated state
            queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
        },
    });
}

// Remove an exercise from a session
export function useRemoveExerciseFromSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sessionId,
            sessionExerciseId,
        }: {
            sessionId: string;
            sessionExerciseId: string;
        }) => sessionService.removeExercise(sessionId, sessionExerciseId),
        onSuccess: (_data, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
        },
    });
}

// Reorder exercises in a session
export function useReorderExercises() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sessionId,
            exerciseIds,
        }: {
            sessionId: string;
            exerciseIds: string[];
        }) => sessionService.reorderExercises(sessionId, exerciseIds),
        onSuccess: (updatedSession) => {
            queryClient.setQueryData(
                sessionKeys.detail(updatedSession.id),
                updatedSession
            );
        },
    });
}

// Add a set to an exercise
export function useAddSet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: {
            sessionExerciseId: string;
            dto: CreateSetDTO;
            sessionId: string;
        }) => sessionService.addSet(variables.sessionId, variables.sessionExerciseId, variables.dto),
        onSuccess: (_newSet, variables) => {
            queryClient.invalidateQueries({ queryKey: sessionKeys.detail(variables.sessionId) });
        },
        onError: (error) => {
            console.error('Failed to add set:', error);
        },
    });
}

// Update a set (optimistic update)
export function useUpdateSet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            setId,
            dto,
            sessionId,
        }: {
            setId: string;
            dto: UpdateSetDTO;
            sessionId: string;
        }) => sessionService.updateSet(sessionId, setId, dto),
        onMutate: async ({ setId, dto, sessionId }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: sessionKeys.detail(sessionId) });

            // Snapshot the previous value
            const previousSession = queryClient.getQueryData<WorkoutSession>(
                sessionKeys.detail(sessionId)
            );

            // Optimistically update
            if (previousSession) {
                const updatedSession = {
                    ...previousSession,
                    exercises: previousSession.exercises.map((ex) => ({
                        ...ex,
                        sets: ex.sets.map((set) =>
                            set.id === setId ? { ...set, ...dto } : set
                        ),
                    })),
                };
                queryClient.setQueryData(sessionKeys.detail(sessionId), updatedSession);
            }

            return { previousSession };
        },
        onError: (_err, { sessionId }, context) => {
            // Rollback on error
            if (context?.previousSession) {
                queryClient.setQueryData(
                    sessionKeys.detail(sessionId),
                    context.previousSession
                );
            }
            console.error('Failed to update set:', _err);
        },
        onSettled: (_data, _error, { sessionId }) => {
            // Refetch after error or success
            queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
        },
    });
}

// Delete a set
export function useDeleteSet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: {
            setId: string;
            sessionId: string;
        }) => sessionService.deleteSet(variables.sessionId, variables.setId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: sessionKeys.detail(variables.sessionId) });
        },
        onError: (error) => {
            console.error('Failed to delete set:', error);
        },
    });
}

// Reorder sets within an exercise
export function useReorderSets() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: {
            sessionExerciseId: string;
            setIds: string[];
            sessionId: string;
        }) => sessionService.reorderSets(variables.sessionId, variables.sessionExerciseId, variables.setIds),
        onSuccess: (_reorderedSets, variables) => {
            queryClient.invalidateQueries({ queryKey: sessionKeys.detail(variables.sessionId) });
        },
    });
}
