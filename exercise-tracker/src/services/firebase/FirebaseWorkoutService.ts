
import {
    collection,
    getDocs,
    query,
    where,
    writeBatch,
    doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { IWorkoutService } from '../interfaces/IWorkoutService';
import type { WorkoutTemplate, WorkoutCompletion } from '@/domain';

const DEFAULT_TEMPLATES: Omit<WorkoutTemplate, 'id' | 'createdBy' | 'isPublic'>[] = [
    {
        name: "Upper Power",
        type: "upper",
        exercises: [
            { id: "bench_press", name: "Bench Press", defaultSets: 3, defaultReps: 5, defaultWeight: 60 },
            { id: "bent_over_row", name: "Bent Over Row", defaultSets: 3, defaultReps: 8, defaultWeight: 50 },
            { id: "overhead_press", name: "Overhead Press", defaultSets: 3, defaultReps: 8, defaultWeight: 40 }
        ]
    },
    {
        name: "Lower Power",
        type: "lower",
        exercises: [
            { id: "squat", name: "Squat", defaultSets: 3, defaultReps: 5, defaultWeight: 80 },
            { id: "deadlift", name: "Deadlift", defaultSets: 1, defaultReps: 5, defaultWeight: 100 },
            { id: "leg_press", name: "Leg Press", defaultSets: 3, defaultReps: 10, defaultWeight: 120 }
        ]
    },
    {
        name: "Push Hypertrophy",
        type: "push",
        exercises: [
            { id: "incline_bench", name: "Incline Bench", defaultSets: 3, defaultReps: 10, defaultWeight: 50 },
            { id: "lateral_raise", name: "Lateral Raise", defaultSets: 4, defaultReps: 15, defaultWeight: 10 },
            { id: "tricep_pushdown", name: "Tricep Pushdown", defaultSets: 3, defaultReps: 12, defaultWeight: 20 }
        ]
    },
    {
        name: "Pull Hypertrophy",
        type: "pull",
        exercises: [
            { id: "pull_up", name: "Pull Up", defaultSets: 3, defaultReps: 8, defaultWeight: 0 },
            { id: "face_pull", name: "Face Pull", defaultSets: 4, defaultReps: 15, defaultWeight: 15 },
            { id: "hammer_curl", name: "Hammer Curl", defaultSets: 3, defaultReps: 12, defaultWeight: 12 }
        ]
    }
];

const MOCK_AI_SUGGESTIONS: WorkoutTemplate[] = [
    {
        id: "ai_1",
        name: "AI: Full Body Burn",
        type: "legs", // Mixed
        createdBy: "ai",
        isPublic: false,
        exercises: [
            { id: "goblet_squat", name: "Goblet Squat", defaultSets: 3, defaultReps: 12, defaultWeight: 20 },
            { id: "push_up", name: "Push Up", defaultSets: 3, defaultReps: 15, defaultWeight: 0 },
            { id: "plank", name: "Plank", defaultSets: 3, defaultReps: 60, defaultWeight: 0 }
        ]
    },
    {
        id: "ai_2",
        name: "AI: Core Crusher",
        type: "upper",
        createdBy: "ai",
        isPublic: false,
        exercises: [
            { id: "crunch", name: "Crunch", defaultSets: 4, defaultReps: 20, defaultWeight: 0 },
            { id: "leg_raise", name: "Leg Raise", defaultSets: 3, defaultReps: 15, defaultWeight: 0 }
        ]
    }
];

export class FirebaseWorkoutService implements IWorkoutService {
    async getTemplates(userId: string): Promise<WorkoutTemplate[]> {
        if (!db) throw new Error("Firebase DB not initialized");
        const q = query(collection(db, 'users', userId, 'workoutTemplates'));
        const docSnaps = await getDocs(q);

        return docSnaps.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as WorkoutTemplate));
    }

    async getSuggestedWorkouts(_userId: string): Promise<WorkoutTemplate[]> {
        // Mock implementation
        return Promise.resolve(MOCK_AI_SUGGESTIONS);
    }

    async seedTemplates(userId: string): Promise<void> {
        if (!db) throw new Error("Firebase DB not initialized");
        const existing = await this.getTemplates(userId);
        if (existing.length > 0) return;

        const batch = writeBatch(db);
        const colRef = collection(db, 'users', userId, 'workoutTemplates');

        DEFAULT_TEMPLATES.forEach(tmpl => {
            const docRef = doc(colRef);
            batch.set(docRef, {
                ...tmpl,
                createdBy: 'system',
                isPublic: false
            });
        });

        await batch.commit();
    }

    async getCompletionsForMonth(userId: string, year: number, month: number): Promise<WorkoutCompletion[]> {
        if (!db) throw new Error("Firebase DB not initialized");
        // month is 0-indexed

        const startPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

        const q = query(
            collection(db, 'users', userId, 'workoutsCompleted'),
            where('date', '>=', `${startPrefix}-01`),
            where('date', '<=', `${startPrefix}-31`)
        );

        const snaps = await getDocs(q);
        return snaps.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : new Date(data.completedAt)
            } as WorkoutCompletion;
        });
    }
}

export const firebaseWorkoutService = new FirebaseWorkoutService();
