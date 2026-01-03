// Service interface for Exercise operations
// This abstraction allows swapping mock ↔ Firebase implementations

import type {
    Exercise,
    CreateExerciseDTO,
    UpdateExerciseDTO,
    MuscleGroup,
} from '@/domain';

export interface DuplicateCheckResult {
    hasDuplicate: boolean;
    exactMatch?: Exercise;
    similarMatches: Exercise[];
}

export interface IExerciseService {
    /**
     * Get all exercises (both global and user-created)
     */
    getAll(): Promise<Exercise[]>;

    /**
     * Get only global/system exercises
     */
    getGlobalExercises(): Promise<Exercise[]>;

    /**
     * Get only user-created exercises
     */
    getUserExercises(userId: string): Promise<Exercise[]>;

    /**
     * Get a single exercise by ID
     */
    getById(id: string): Promise<Exercise | null>;

    /**
     * Create a new user exercise
     */
    create(userId: string, dto: CreateExerciseDTO): Promise<Exercise>;

    /**
     * Update an existing exercise (user-owned only)
     */
    update(id: string, dto: UpdateExerciseDTO): Promise<Exercise>;

    /**
     * Soft-delete an exercise (user-owned only)
     */
    delete(id: string): Promise<void>;

    /**
     * Search exercises by name
     */
    search(query: string, userId?: string): Promise<Exercise[]>;

    /**
     * Filter exercises by muscle group
     */
    filterByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]>;

    /**
     * Check for duplicate or similar exercises before creation
     */
    checkForDuplicates(
        name: string,
        userId: string
    ): Promise<DuplicateCheckResult>;
}
