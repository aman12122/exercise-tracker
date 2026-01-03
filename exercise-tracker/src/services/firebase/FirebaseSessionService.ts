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
    limit,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { ISessionService } from '../interfaces/ISessionService';
import type {
    WorkoutSession,
    SessionExercise,
    SetLog,
    CreateSessionDTO,
    CreateSetDTO,
    UpdateSetDTO
} from '@/domain';
import { getNextSetNumber } from '@/domain';
import { firebaseExerciseService } from './FirebaseExerciseService';
import { v4 as uuidv4 } from 'uuid';

const mapSession = (id: string, data: any): WorkoutSession => ({
    id,
    ...data,
    sessionDate: data.sessionDate?.toDate ? data.sessionDate.toDate() : new Date(data.sessionDate),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : undefined,
    completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : undefined,
});

export class FirebaseSessionService implements ISessionService {

    private getUserIdOrThrow(): string {
        if (!auth) throw new Error("Firebase Auth not initialized");
        if (!auth.currentUser) throw new Error("User must be logged in");
        return auth.currentUser.uid;
    }

    async getAllForUser(userId: string): Promise<WorkoutSession[]> {
        if (!db) throw new Error("Firebase DB not initialized");
        const q = query(
            collection(db, 'users', userId, 'workoutSessions'),
            orderBy('sessionDate', 'desc')
        );
        const snaps = await getDocs(q);
        return snaps.docs.map(d => mapSession(d.id, d.data()));
    }

    async getByDate(userId: string, date: Date): Promise<WorkoutSession | null> {
        if (!db) throw new Error("Firebase DB not initialized");
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, 'users', userId, 'workoutSessions'),
            where('sessionDate', '>=', Timestamp.fromDate(start)),
            where('sessionDate', '<=', Timestamp.fromDate(end)),
            limit(1)
        );

        const snaps = await getDocs(q);
        if (snaps.empty) return null;
        return mapSession(snaps.docs[0].id, snaps.docs[0].data());
    }

    async getSessionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutSession[]> {
        if (!db) throw new Error("Firebase DB not initialized");
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, 'users', userId, 'workoutSessions'),
            where('sessionDate', '>=', Timestamp.fromDate(start)),
            where('sessionDate', '<=', Timestamp.fromDate(end)),
            orderBy('sessionDate', 'asc')
        );

        const snaps = await getDocs(q);
        return snaps.docs.map(d => mapSession(d.id, d.data()));
    }

    async getById(id: string): Promise<WorkoutSession | null> {
        // We need userId. If not passed, we try to use current auth user.
        // If the caller is passing an ID, they should have access if they own it.
        // If we don't know the userId, we can't construct the path.
        // HACK: Use Collection Group Query strictly for ID lookup? No, security rules prevent reading others.
        // We will assume the current authenticated user implies the path /users/{me}/sessions/{id}

        try {
            if (!db) throw new Error("Firebase DB not initialized");
            const userId = this.getUserIdOrThrow();
            const docRef = doc(db, 'users', userId, 'workoutSessions', id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            return mapSession(snap.id, snap.data());
        } catch (e) {
            console.error("Error getting session by ID", e);
            return null;
        }
    }

    async getActiveSession(userId: string): Promise<WorkoutSession | null> {
        if (!db) throw new Error("Firebase DB not initialized");
        const q = query(
            collection(db, 'users', userId, 'workoutSessions'),
            where('status', '==', 'in_progress'),
            limit(1)
        );
        const snaps = await getDocs(q);
        if (snaps.empty) return null;
        return mapSession(snaps.docs[0].id, snaps.docs[0].data());
    }

    async create(userId: string, dto: CreateSessionDTO): Promise<WorkoutSession> {
        if (!db) throw new Error("Firebase DB not initialized");
        const ref = collection(db, 'users', userId, 'workoutSessions');

        let initialExercises: SessionExercise[] = [];

        // 1. Pre-fetch exercises if provided (Parallel Read)
        if (dto.initialExerciseIds && dto.initialExerciseIds.length > 0) {
            const exercises = await Promise.all(
                dto.initialExerciseIds.map(id => firebaseExerciseService.getById(id))
            );

            initialExercises = exercises.map((ex, index) => {
                if (!ex) return null;
                // Clean undefined and ensure clean object
                const cleanEx = JSON.parse(JSON.stringify(ex));
                return {
                    id: uuidv4(),
                    exerciseId: cleanEx.id,
                    exercise: cleanEx,
                    orderIndex: index,
                    sets: [] as SetLog[]
                } as SessionExercise;
            }).filter((ex): ex is SessionExercise => ex !== null);
        }

        // 2. Prepare session object
        const newSessionData = {
            ...dto,
            // Remove our special DTO fields so they don't get saved to Firestore
            initialExerciseIds: undefined,
            startImmediately: undefined,

            userId,
            name: dto.name || "Custom Workout",
            status: dto.startImmediately ? 'in_progress' : 'not_started',
            exercises: initialExercises,
            sessionDate: Timestamp.fromDate(dto.sessionDate),
            startedAt: dto.startImmediately ? serverTimestamp() : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Remove undefined fields
        const cleanData = JSON.parse(JSON.stringify(newSessionData));

        // 3. Single Write
        const newDoc = await addDoc(ref, cleanData);

        const snap = await getDoc(newDoc);
        return mapSession(snap.id, snap.data());
    }

    private async updateSessionField(sessionId: string, updates: any): Promise<WorkoutSession> {
        if (!db) throw new Error("Firebase DB not initialized");
        const userId = this.getUserIdOrThrow();
        const ref = doc(db, 'users', userId, 'workoutSessions', sessionId);
        await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
        const snap = await getDoc(ref);
        return mapSession(snap.id, snap.data());
    }

    async startSession(sessionId: string): Promise<WorkoutSession> {
        return this.updateSessionField(sessionId, {
            status: 'in_progress',
            startedAt: serverTimestamp()
        });
    }

    async completeSession(sessionId: string): Promise<WorkoutSession> {
        if (!db) throw new Error("Firebase DB not initialized");
        const userId = this.getUserIdOrThrow();
        const sessionRef = doc(db, 'users', userId, 'workoutSessions', sessionId);

        const snap = await getDoc(sessionRef);
        if (!snap.exists()) throw new Error("Session does not exist");
        const sessionData = mapSession(snap.id, snap.data());

        const batch = writeBatch(db);
        const completedAt = new Date();

        // Update session status
        batch.update(sessionRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Write summary to workoutsCompleted
        // Format YYYY-MM-DD locally
        const dateStr = sessionData.sessionDate.toISOString().split('T')[0];
        const summaryRef = doc(db, 'users', userId, 'workoutsCompleted', dateStr);

        batch.set(summaryRef, {
            date: dateStr,
            type: sessionData.type || 'custom', // fallback
            sessionId: sessionId,
            name: sessionData.name,
            completedAt: serverTimestamp()
        });

        await batch.commit();

        return {
            ...sessionData,
            status: 'completed',
            completedAt: completedAt,
            updatedAt: completedAt
        };
    }

    async abandonSession(sessionId: string): Promise<WorkoutSession> {
        return this.updateSessionField(sessionId, {
            status: 'abandoned'
        });
    }

    // --- Complex Exercise/Set Operations (Read-Modify-Write) ---
    // Helper handles fetching, modifying, and saving back the exercise array
    private async modifySession(sessionId: string, modifier: (session: WorkoutSession) => WorkoutSession): Promise<any> {
        if (!db) throw new Error("Firebase DB not initialized");
        const userId = this.getUserIdOrThrow();
        const ref = doc(db, 'users', userId, 'workoutSessions', sessionId);

        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Session not found");

        const session = mapSession(snap.id, snap.data());
        const updatedSession = modifier(session);

        // Clean undefined values from exercises - Firestore doesn't accept undefined
        const cleanExercises = JSON.parse(JSON.stringify(updatedSession.exercises));

        await updateDoc(ref, {
            exercises: cleanExercises,
            updatedAt: serverTimestamp()
        });

        return updatedSession;
    }

    async addExercise(sessionId: string, exerciseId: string): Promise<SessionExercise> {
        if (!auth) throw new Error("Firebase Auth not initialized");
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");

        const exercise = await firebaseExerciseService.getById(exerciseId);
        if (!exercise) throw new Error("Exercise not found");

        // Clean undefined values from exercise - Firestore doesn't accept undefined
        const cleanExercise = JSON.parse(JSON.stringify(exercise));

        const sessionExercise: SessionExercise = {
            id: uuidv4(),
            exerciseId,
            exercise: cleanExercise,
            orderIndex: 0,
            sets: []
        };

        let resultEx;
        await this.modifySession(sessionId, (s) => {
            sessionExercise.orderIndex = s.exercises.length;
            s.exercises.push(sessionExercise);
            resultEx = sessionExercise;
            return s;
        });

        return resultEx!;
    }

    async removeExercise(sessionId: string, sessionExerciseId: string): Promise<void> {
        await this.modifySession(sessionId, (s) => {
            s.exercises = s.exercises.filter(ex => ex.id !== sessionExerciseId);
            s.exercises.forEach((ex, idx) => ex.orderIndex = idx);
            return s;
        });
    }

    async reorderExercises(sessionId: string, exerciseIds: string[]): Promise<WorkoutSession> {
        return this.modifySession(sessionId, (s) => {
            const map = new Map(s.exercises.map(e => [e.id, e]));
            s.exercises = exerciseIds.map((id, idx) => {
                const ex = map.get(id);
                if (ex) ex.orderIndex = idx;
                return ex!;
            }).filter(Boolean);
            return s;
        });
    }

    async addSet(sessionId: string, sessionExerciseId: string, dto: CreateSetDTO): Promise<SetLog> {
        let newSet: SetLog;
        await this.modifySession(sessionId, (s) => {
            const ex = s.exercises.find(e => e.id === sessionExerciseId);
            if (!ex) throw new Error("Exercise not found in session");

            if (!ex.sets) ex.sets = [];
            newSet = {
                id: uuidv4(),
                setNumber: getNextSetNumber(ex.sets),
                reps: dto.reps,
                weight: dto.weight,
                notes: dto.notes,
                loggedAt: new Date()
            };
            ex.sets.push(newSet);
            return s;
        });
        return newSet!;
    }

    async updateSet(sessionId: string, setId: string, dto: UpdateSetDTO): Promise<SetLog> {
        let updatedParams: SetLog | undefined;
        await this.modifySession(sessionId, (s) => {
            for (const exercise of s.exercises) {
                const setIdx = exercise.sets.findIndex(set => set.id === setId);
                if (setIdx !== -1) {
                    exercise.sets[setIdx] = { ...exercise.sets[setIdx], ...dto };
                    updatedParams = exercise.sets[setIdx];
                    return s;
                }
            }
            throw new Error("Set not found");
        });
        return updatedParams!;
    }

    async deleteSet(sessionId: string, setId: string): Promise<void> {
        await this.modifySession(sessionId, (s) => {
            for (const exercise of s.exercises) {
                const setIdx = exercise.sets.findIndex(set => set.id === setId);
                if (setIdx !== -1) {
                    exercise.sets.splice(setIdx, 1);
                    // Re-index set numbers
                    exercise.sets.forEach((set, idx) => set.setNumber = idx + 1);
                    return s;
                }
            }
            throw new Error("Set not found");
        });
    }

    async reorderSets(sessionId: string, sessionExerciseId: string, setIds: string[]): Promise<SetLog[]> {
        let resultSets: SetLog[] = [];
        await this.modifySession(sessionId, (s) => {
            const ex = s.exercises.find(e => e.id === sessionExerciseId);
            if (!ex) throw new Error("Exercise not found");

            const map = new Map(ex.sets.map(set => [set.id, set]));
            ex.sets = setIds.map((id, i) => {
                const set = map.get(id);
                if (!set) throw new Error("Set missing");
                set.setNumber = i + 1;
                return set;
            });
            resultSets = ex.sets;
            return s;
        });
        return resultSets;
    }
}

export const firebaseSessionService = new FirebaseSessionService();
