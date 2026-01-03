// UI state store using Zustand
// Global UI state that's not related to server data

import { create } from 'zustand';

interface UIState {
    // Active workout session UI state
    activeSessionId: string | null;
    isExerciseSelectorOpen: boolean;
    selectedExerciseId: string | null;

    // Filter/search state for exercise library
    exerciseSearchQuery: string;
    exerciseMuscleGroupFilter: string | null;

    // Modals and dialogs
    isCreateExerciseModalOpen: boolean;
    isSessionCompleteModalOpen: boolean;

    // Actions
    setActiveSession: (sessionId: string | null) => void;
    openExerciseSelector: () => void;
    closeExerciseSelector: () => void;
    setSelectedExercise: (exerciseId: string | null) => void;
    setExerciseSearchQuery: (query: string) => void;
    setExerciseMuscleGroupFilter: (muscleGroup: string | null) => void;
    openCreateExerciseModal: () => void;
    closeCreateExerciseModal: () => void;
    openSessionCompleteModal: () => void;
    closeSessionCompleteModal: () => void;
    resetUI: () => void;
}

const initialState = {
    activeSessionId: null,
    isExerciseSelectorOpen: false,
    selectedExerciseId: null,
    exerciseSearchQuery: '',
    exerciseMuscleGroupFilter: null,
    isCreateExerciseModalOpen: false,
    isSessionCompleteModalOpen: false,
};

export const useUIStore = create<UIState>()((set) => ({
    ...initialState,

    setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

    openExerciseSelector: () => set({ isExerciseSelectorOpen: true }),
    closeExerciseSelector: () => set({
        isExerciseSelectorOpen: false,
        selectedExerciseId: null,
    }),

    setSelectedExercise: (exerciseId) => set({ selectedExerciseId: exerciseId }),

    setExerciseSearchQuery: (query) => set({ exerciseSearchQuery: query }),
    setExerciseMuscleGroupFilter: (muscleGroup) =>
        set({ exerciseMuscleGroupFilter: muscleGroup }),

    openCreateExerciseModal: () => set({ isCreateExerciseModalOpen: true }),
    closeCreateExerciseModal: () => set({ isCreateExerciseModalOpen: false }),

    openSessionCompleteModal: () => set({ isSessionCompleteModalOpen: true }),
    closeSessionCompleteModal: () => set({ isSessionCompleteModalOpen: false }),

    resetUI: () => set(initialState),
}));
