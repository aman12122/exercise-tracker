// Default exercise catalog - global exercises available to all users
import type { Exercise, MuscleGroup, Equipment } from '@/domain';

type ExerciseTemplate = Omit<Exercise, 'id' | 'createdAt' | 'isDeleted' | 'isGlobal' | 'userId'>;

const createGlobalExercise = (
    id: string,
    template: ExerciseTemplate
): Exercise => ({
    id,
    ...template,
    isGlobal: true,
    isDeleted: false,
    createdAt: new Date('2024-01-01'),
});

interface ExerciseData {
    name: string;
    muscleGroup: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
    equipment?: Equipment;
}

const CHEST_EXERCISES: ExerciseData[] = [
    { name: 'Barbell Bench Press', muscleGroup: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'barbell' },
    { name: 'Incline Barbell Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'barbell' },
    { name: 'Dumbbell Bench Press', muscleGroup: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'dumbbell' },
    { name: 'Incline Dumbbell Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'dumbbell' },
    { name: 'Dumbbell Flyes', muscleGroup: 'chest', equipment: 'dumbbell' },
    { name: 'Cable Flyes', muscleGroup: 'chest', equipment: 'cable' },
    { name: 'Push-ups', muscleGroup: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'bodyweight' },
    { name: 'Chest Dips', muscleGroup: 'chest', secondaryMuscles: ['triceps'], equipment: 'bodyweight' },
    { name: 'Machine Chest Press', muscleGroup: 'chest', equipment: 'machine' },
    { name: 'Pec Deck Machine', muscleGroup: 'chest', equipment: 'machine' },
];

const BACK_EXERCISES: ExerciseData[] = [
    { name: 'Deadlift', muscleGroup: 'back', secondaryMuscles: ['hamstrings', 'glutes', 'core'], equipment: 'barbell' },
    { name: 'Barbell Row', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'barbell' },
    { name: 'Dumbbell Row', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'dumbbell' },
    { name: 'Pull-ups', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'bodyweight' },
    { name: 'Chin-ups', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'bodyweight' },
    { name: 'Lat Pulldown', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'cable' },
    { name: 'Seated Cable Row', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'cable' },
    { name: 'T-Bar Row', muscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'barbell' },
    { name: 'Face Pulls', muscleGroup: 'back', secondaryMuscles: ['shoulders'], equipment: 'cable' },
];

const SHOULDER_EXERCISES: ExerciseData[] = [
    { name: 'Overhead Press', muscleGroup: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'barbell' },
    { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell' },
    { name: 'Lateral Raises', muscleGroup: 'shoulders', equipment: 'dumbbell' },
    { name: 'Front Raises', muscleGroup: 'shoulders', equipment: 'dumbbell' },
    { name: 'Rear Delt Flyes', muscleGroup: 'shoulders', equipment: 'dumbbell' },
    { name: 'Arnold Press', muscleGroup: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell' },
    { name: 'Upright Rows', muscleGroup: 'shoulders', secondaryMuscles: ['biceps'], equipment: 'barbell' },
    { name: 'Shrugs', muscleGroup: 'shoulders', equipment: 'dumbbell' },
];

const ARM_EXERCISES: ExerciseData[] = [
    { name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'barbell' },
    { name: 'Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
    { name: 'Hammer Curl', muscleGroup: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell' },
    { name: 'Preacher Curl', muscleGroup: 'biceps', equipment: 'barbell' },
    { name: 'Concentration Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
    { name: 'Cable Curl', muscleGroup: 'biceps', equipment: 'cable' },
    { name: 'Tricep Pushdown', muscleGroup: 'triceps', equipment: 'cable' },
    { name: 'Skull Crushers', muscleGroup: 'triceps', equipment: 'barbell' },
    { name: 'Overhead Tricep Extension', muscleGroup: 'triceps', equipment: 'dumbbell' },
    { name: 'Tricep Dips', muscleGroup: 'triceps', secondaryMuscles: ['chest'], equipment: 'bodyweight' },
    { name: 'Close-Grip Bench Press', muscleGroup: 'triceps', secondaryMuscles: ['chest'], equipment: 'barbell' },
    { name: 'Wrist Curls', muscleGroup: 'forearms', equipment: 'dumbbell' },
];

const LEG_EXERCISES: ExerciseData[] = [
    { name: 'Barbell Squat', muscleGroup: 'quadriceps', secondaryMuscles: ['glutes', 'hamstrings', 'core'], equipment: 'barbell' },
    { name: 'Front Squat', muscleGroup: 'quadriceps', secondaryMuscles: ['glutes', 'core'], equipment: 'barbell' },
    { name: 'Leg Press', muscleGroup: 'quadriceps', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'machine' },
    { name: 'Leg Extension', muscleGroup: 'quadriceps', equipment: 'machine' },
    { name: 'Lunges', muscleGroup: 'quadriceps', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'dumbbell' },
    { name: 'Bulgarian Split Squat', muscleGroup: 'quadriceps', secondaryMuscles: ['glutes'], equipment: 'dumbbell' },
    { name: 'Romanian Deadlift', muscleGroup: 'hamstrings', secondaryMuscles: ['glutes', 'back'], equipment: 'barbell' },
    { name: 'Leg Curl', muscleGroup: 'hamstrings', equipment: 'machine' },
    { name: 'Hip Thrust', muscleGroup: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'barbell' },
    { name: 'Glute Bridge', muscleGroup: 'glutes', equipment: 'bodyweight' },
    { name: 'Calf Raises', muscleGroup: 'calves', equipment: 'machine' },
    { name: 'Seated Calf Raises', muscleGroup: 'calves', equipment: 'machine' },
];

const CORE_EXERCISES: ExerciseData[] = [
    { name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight' },
    { name: 'Crunches', muscleGroup: 'core', equipment: 'bodyweight' },
    { name: 'Leg Raises', muscleGroup: 'core', equipment: 'bodyweight' },
    { name: 'Russian Twists', muscleGroup: 'core', equipment: 'bodyweight' },
    { name: 'Cable Woodchops', muscleGroup: 'core', equipment: 'cable' },
    { name: 'Ab Wheel Rollout', muscleGroup: 'core', equipment: 'other' },
    { name: 'Hanging Leg Raises', muscleGroup: 'core', equipment: 'bodyweight' },
    { name: 'Dead Bug', muscleGroup: 'core', equipment: 'bodyweight' },
];

// Generate all exercises with unique IDs
const allExerciseData: ExerciseData[] = [
    ...CHEST_EXERCISES,
    ...BACK_EXERCISES,
    ...SHOULDER_EXERCISES,
    ...ARM_EXERCISES,
    ...LEG_EXERCISES,
    ...CORE_EXERCISES,
];

export const DEFAULT_EXERCISES: Exercise[] = allExerciseData.map((data, index) =>
    createGlobalExercise(`global-exercise-${String(index + 1).padStart(3, '0')}`, data)
);

export function getDefaultExerciseById(id: string): Exercise | undefined {
    return DEFAULT_EXERCISES.find(e => e.id === id);
}
