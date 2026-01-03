// Domain model for Exercise
export interface Exercise {
    id: string;
    name: string;
    muscleGroup: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
    equipment?: Equipment;
    notes?: string;
    isGlobal: boolean; // true = system exercise, false = user-created
    userId?: string; // null for global exercises
    isDeleted: boolean;
    createdAt: Date;
}

export type MuscleGroup =
    | 'chest'
    | 'back'
    | 'shoulders'
    | 'biceps'
    | 'triceps'
    | 'forearms'
    | 'core'
    | 'quadriceps'
    | 'hamstrings'
    | 'glutes'
    | 'calves'
    | 'full_body';

export type Equipment =
    | 'barbell'
    | 'dumbbell'
    | 'kettlebell'
    | 'machine'
    | 'cable'
    | 'bodyweight'
    | 'bands'
    | 'other';

export interface CreateExerciseDTO {
    name: string;
    muscleGroup: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
    equipment?: Equipment;
    notes?: string;
}

export interface UpdateExerciseDTO {
    name?: string;
    muscleGroup?: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
    equipment?: Equipment;
    notes?: string;
}

// Display labels for UI
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
    chest: 'Chest',
    back: 'Back',
    shoulders: 'Shoulders',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Forearms',
    core: 'Core',
    quadriceps: 'Quadriceps',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    calves: 'Calves',
    full_body: 'Full Body',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
    barbell: 'Barbell',
    dumbbell: 'Dumbbell',
    kettlebell: 'Kettlebell',
    machine: 'Machine',
    cable: 'Cable',
    bodyweight: 'Bodyweight',
    bands: 'Resistance Bands',
    other: 'Other',
};
