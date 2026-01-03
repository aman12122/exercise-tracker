
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { IExerciseService, DuplicateCheckResult } from '../interfaces/IExerciseService';
import type { Exercise, CreateExerciseDTO, UpdateExerciseDTO, MuscleGroup } from '@/domain';

const FALLBACK_EXERCISES: Record<string, Partial<Exercise>> = {
    bench_press: { name: 'Bench Press', muscleGroup: 'chest' },
    bent_over_row: { name: 'Bent Over Row', muscleGroup: 'back' },
    overhead_press: { name: 'Overhead Press', muscleGroup: 'shoulders' },
    squat: { name: 'Squat', muscleGroup: 'quadriceps' },
    deadlift: { name: 'Deadlift', muscleGroup: 'hamstrings' },
    leg_press: { name: 'Leg Press', muscleGroup: 'quadriceps' },
    incline_bench: { name: 'Incline Bench', muscleGroup: 'chest' },
    lateral_raise: { name: 'Lateral Raise', muscleGroup: 'shoulders' },
    tricep_pushdown: { name: 'Tricep Pushdown', muscleGroup: 'triceps' },
    pull_up: { name: 'Pull Up', muscleGroup: 'back' },
    face_pull: { name: 'Face Pull', muscleGroup: 'shoulders' },
    hammer_curl: { name: 'Hammer Curl', muscleGroup: 'biceps' },
    goblet_squat: { name: 'Goblet Squat', muscleGroup: 'quadriceps' },
    push_up: { name: 'Push Up', muscleGroup: 'chest' },
    plank: { name: 'Plank', muscleGroup: 'core' },
    crunch: { name: 'Crunch', muscleGroup: 'core' },
    leg_raise: { name: 'Leg Raise', muscleGroup: 'core' },
    dumbbell_row: { name: 'Dumbbell Row', muscleGroup: 'back' },
    lunges: { name: 'Lunges', muscleGroup: 'quadriceps' },
    bicep_curl: { name: 'Bicep Curl', muscleGroup: 'biceps' },
    tricep_extension: { name: 'Tricep Extension', muscleGroup: 'triceps' }
};

export class FirebaseExerciseService implements IExerciseService {

    async getAll(): Promise<Exercise[]> {
        if (!db) throw new Error("Firebase DB not initialized");
        // Fetch global exercises
        const globalQuery = query(collection(db, 'global_exercises'), orderBy('name'));
        const globalSnaps = await getDocs(globalQuery);
        const globalExercises = globalSnaps.docs.map(d => ({ id: d.id, ...d.data(), isGlobal: true } as Exercise));
        return globalExercises;
    }

    async getGlobalExercises(): Promise<Exercise[]> {
        if (!db) throw new Error("Firebase DB not initialized");
        const q = query(collection(db, 'global_exercises'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isGlobal: true } as Exercise));
    }

    async getUserExercises(userId: string): Promise<Exercise[]> {
        if (!db) throw new Error("Firebase DB not initialized");
        const q = query(
            collection(db, 'users', userId, 'exercises'),
            where('isDeleted', '==', false),
            orderBy('name')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
    }

    async getById(id: string): Promise<Exercise | null> {
        // Try global first
        try {
            if (db) {
                const globalDoc = await getDoc(doc(db, 'global_exercises', id));
                if (globalDoc.exists()) {
                    return { id: globalDoc.id, ...globalDoc.data(), isGlobal: true } as Exercise;
                }
            }
        } catch (e) {
            // ignore
        }

        // Return fallback if exists (Mock support)
        if (FALLBACK_EXERCISES[id]) {
            return {
                id,
                name: FALLBACK_EXERCISES[id].name!,
                muscleGroup: FALLBACK_EXERCISES[id].muscleGroup as MuscleGroup,
                equipment: 'none' as any, // Cast to avoid literal mismatch with Equipment type
                isGlobal: true,
                isCustom: false,
                isDeleted: false,
                createdAt: new Date(),
                userId: 'system'
            } as Exercise;
        }

        return null; // Should we try user exercises too? Usually passed ID knows where it is from. 
        // But for robustness, I could check. But user exercises usually have random IDs, not 'bench_press'.
    }

    async create(userId: string, dto: CreateExerciseDTO): Promise<Exercise> {
        if (!db) throw new Error("Firebase DB not initialized");
        const exercisesRef = collection(db, 'users', userId, 'exercises');
        const newDocRef = await addDoc(exercisesRef, {
            ...dto,
            userId,
            isCustom: true,
            isGlobal: false,
            isDeleted: false,
            createdAt: serverTimestamp(),
            // Store normalized name for easier duplicate checking
            nameNormalized: dto.name.toLowerCase().trim()
        });

        // Fetch back to return complete object
        const snap = await getDoc(newDocRef);
        return {
            id: snap.id,
            ...snap.data(),
            createdAt: new Date() // Approximate
        } as Exercise;
    }

    async update(id: string, dto: UpdateExerciseDTO): Promise<Exercise> {
        if (!auth) throw new Error("Firebase Auth not initialized");
        const user = auth.currentUser;
        if (!user) throw new Error("Must be logged in to update exercise");
        if (!db) throw new Error("Firebase DB not initialized");

        const docRef = doc(db, 'users', user.uid, 'exercises', id);
        await updateDoc(docRef, { ...dto });

        const snap = await getDoc(docRef);
        return { id: snap.id, ...snap.data() } as Exercise;
    }

    async delete(id: string): Promise<void> {
        if (!auth) throw new Error("Firebase Auth not initialized");
        const user = auth.currentUser;
        if (!user) throw new Error("Must be logged in to delete exercise");
        if (!db) throw new Error("Firebase DB not initialized");

        const docRef = doc(db, 'users', user.uid, 'exercises', id);
        // Soft delete
        await updateDoc(docRef, { isDeleted: true });
    }

    async search(queryText: string, userId?: string): Promise<Exercise[]> {
        const global = await this.getGlobalExercises();
        let user: Exercise[] = [];
        if (userId) {
            user = await this.getUserExercises(userId);
        }

        const all = [...global, ...user];
        const lower = queryText.toLowerCase();

        return all.filter(e =>
            e.name.toLowerCase().includes(lower) ||
            e.muscleGroup.includes(lower)
        );
    }

    async filterByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
        if (!db) return [];
        // Global
        const qGlobal = query(
            collection(db, 'global_exercises'),
            where('muscleGroup', '==', muscleGroup)
        );
        const globalSnaps = await getDocs(qGlobal);
        const global = globalSnaps.docs.map(d => ({ id: d.id, ...d.data(), isGlobal: true } as Exercise));

        // User
        const user = auth?.currentUser;
        let userEx: Exercise[] = [];
        if (user && db) {
            const qUser = query(
                collection(db, 'users', user.uid, 'exercises'),
                where('muscleGroup', '==', muscleGroup),
                where('isDeleted', '==', false)
            );
            const userSnaps = await getDocs(qUser);
            userEx = userSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
        }

        return [...global, ...userEx];
    }

    async checkForDuplicates(name: string, userId: string): Promise<DuplicateCheckResult> {
        if (!db) return { hasDuplicate: false, similarMatches: [] };
        const normalized = name.toLowerCase().trim();

        const q = query(
            collection(db, 'users', userId, 'exercises'),
            where('nameNormalized', '==', normalized),
            where('isDeleted', '==', false)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
            const match = snap.docs[0].data() as Exercise;
            return { hasDuplicate: true, exactMatch: { ...match, id: snap.docs[0].id }, similarMatches: [] };
        }

        return { hasDuplicate: false, similarMatches: [] };
    }
}

export const firebaseExerciseService = new FirebaseExerciseService();
