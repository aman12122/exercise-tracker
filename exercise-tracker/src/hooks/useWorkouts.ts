
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkoutService } from '@/services';
import { useAuthStore } from '@/store';

export function useTemplates() {
    const userId = useAuthStore(s => s.user?.id);
    return useQuery({
        queryKey: ['templates', userId],
        queryFn: () => userId ? getWorkoutService().getTemplates(userId) : Promise.resolve([]),
        enabled: !!userId
    });
}

export function useSeedTemplates() {
    const userId = useAuthStore(s => s.user?.id);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            if (!userId) return;
            await getWorkoutService().seedTemplates(userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates', userId] });
        }
    });
}

export function useSuggestedWorkouts() {
    const userId = useAuthStore(s => s.user?.id);
    return useQuery({
        queryKey: ['suggested-workouts', userId],
        queryFn: () => userId ? getWorkoutService().getSuggestedWorkouts(userId) : Promise.resolve([]),
        enabled: !!userId
    });
}

export function useMonthlyCompletions(currentDate: Date) {
    const userId = useAuthStore(s => s.user?.id);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11

    return useQuery({
        queryKey: ['completions', userId, year, month],
        queryFn: () => userId ? getWorkoutService().getCompletionsForMonth(userId, year, month) : Promise.resolve([]),
        enabled: !!userId
    });
}
