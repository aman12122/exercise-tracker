// Service interface for Workout Session operations
// This abstraction allows swapping mock ↔ Firebase implementations

import type {
    WorkoutSession,
    SessionExercise,
    SetLog,
    CreateSessionDTO,
    CreateSetDTO,
    UpdateSetDTO,
} from '@/domain';

export interface ISessionService {
    /**
     * Get all sessions for a user
     */
    getAllForUser(userId: string): Promise<WorkoutSession[]>;

    /**
     * Get sessions for a specific date
     */
    getByDate(userId: string, date: Date): Promise<WorkoutSession | null>;

    /**
     * Get sessions for a date range (inclusive)
     */
    getSessionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutSession[]>;

    /**
     * Get a single session by ID
     */
    getById(id: string): Promise<WorkoutSession | null>;

    /**
     * Get the current active (in-progress) session for a user
     */
    getActiveSession(userId: string): Promise<WorkoutSession | null>;

    /**
     * Create a new workout session
     */
    create(userId: string, dto: CreateSessionDTO): Promise<WorkoutSession>;

    /**
     * Start a session (transition from not_started to in_progress)
     */
    startSession(sessionId: string): Promise<WorkoutSession>;

    /**
     * Complete a session (transition from in_progress to completed)
     */
    completeSession(sessionId: string): Promise<WorkoutSession>;

    /**
     * Abandon a session
     */
    abandonSession(sessionId: string): Promise<WorkoutSession>;

    /**
     * Add an exercise to a session
     */
    addExercise(sessionId: string, exerciseId: string): Promise<SessionExercise>;

    /**
     * Remove an exercise from a session
     */
    removeExercise(sessionId: string, sessionExerciseId: string): Promise<void>;

    /**
     * Reorder exercises in a session
     */
    reorderExercises(
        sessionId: string,
        exerciseIds: string[]
    ): Promise<WorkoutSession>;

    /**
     * Add a set to an exercise in a session
     */
    addSet(sessionId: string, sessionExerciseId: string, dto: CreateSetDTO): Promise<SetLog>;

    /**
     * Update a set
     */
    updateSet(sessionId: string, setId: string, dto: UpdateSetDTO): Promise<SetLog>;

    /**
     * Delete a set
     */
    deleteSet(sessionId: string, setId: string): Promise<void>;

    /**
     * Reorder sets within an exercise
     */
    reorderSets(sessionId: string, sessionExerciseId: string, setIds: string[]): Promise<SetLog[]>;
}
