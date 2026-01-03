// Mock implementation of ISessionService using in-memory storage
import { v4 as uuidv4 } from 'uuid';
import type { ISessionService } from '../interfaces/ISessionService';
import type {
    WorkoutSession,
    SessionExercise,
    SetLog,
    CreateSessionDTO,
    CreateSetDTO,
    UpdateSetDTO,
} from '@/domain';
import { getNextSetNumber } from '@/domain';
import { mockExerciseService } from './MockExerciseService';

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const MOCK_LATENCY = 200;

export class MockSessionService implements ISessionService {
    // In-memory store for sessions
    private sessions: Map<string, WorkoutSession> = new Map();

    private getSession(id: string): WorkoutSession {
        const session = this.sessions.get(id);
        if (!session) {
            throw new Error(`Session not found: ${id}`);
        }
        return session;
    }

    async getAllForUser(userId: string): Promise<WorkoutSession[]> {
        await delay(MOCK_LATENCY);
        return Array.from(this.sessions.values())
            .filter(s => s.userId === userId)
            .sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime());
    }

    async getByDate(userId: string, date: Date): Promise<WorkoutSession | null> {
        await delay(MOCK_LATENCY);
        const dateStr = date.toISOString().split('T')[0];
        return (
            Array.from(this.sessions.values()).find(
                s =>
                    s.userId === userId &&
                    s.sessionDate.toISOString().split('T')[0] === dateStr
            ) ?? null
        );
    }

    async getSessionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutSession[]> {
        await delay(MOCK_LATENCY);
        const start = startDate.getTime();
        const end = endDate.getTime();
        return Array.from(this.sessions.values())
            .filter(s => {
                const sessionTime = s.sessionDate.getTime();
                return s.userId === userId && sessionTime >= start && sessionTime <= end;
            })
            .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime());
    }

    async getById(id: string): Promise<WorkoutSession | null> {
        await delay(MOCK_LATENCY / 2);
        return this.sessions.get(id) ?? null;
    }

    async getActiveSession(userId: string): Promise<WorkoutSession | null> {
        await delay(MOCK_LATENCY);
        return (
            Array.from(this.sessions.values()).find(
                s => s.userId === userId && s.status === 'in_progress'
            ) ?? null
        );
    }

    async create(userId: string, dto: CreateSessionDTO): Promise<WorkoutSession> {
        await delay(MOCK_LATENCY);

        const session: WorkoutSession = {
            id: uuidv4(),
            userId,
            templateId: dto.templateId,
            sessionDate: dto.sessionDate,
            type: dto.type,
            name: dto.name || 'Untitled Workout',
            status: 'not_started',
            exercises: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.sessions.set(session.id, session);
        return session;
    }

    async startSession(sessionId: string): Promise<WorkoutSession> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);
        if (session.status !== 'not_started') {
            throw new Error('Session has already been started');
        }

        const updated: WorkoutSession = {
            ...session,
            status: 'in_progress',
            startedAt: new Date(),
            updatedAt: new Date(),
        };

        this.sessions.set(sessionId, updated);
        return updated;
    }

    async completeSession(sessionId: string): Promise<WorkoutSession> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);
        if (session.status !== 'in_progress') {
            throw new Error('Can only complete an in-progress session');
        }

        const updated: WorkoutSession = {
            ...session,
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
        };

        this.sessions.set(sessionId, updated);
        return updated;
    }

    async abandonSession(sessionId: string): Promise<WorkoutSession> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);
        if (session.status !== 'in_progress') {
            throw new Error('Can only abandon an in-progress session');
        }

        const updated: WorkoutSession = {
            ...session,
            status: 'abandoned',
            updatedAt: new Date(),
        };

        this.sessions.set(sessionId, updated);
        return updated;
    }

    async addExercise(
        sessionId: string,
        exerciseId: string
    ): Promise<SessionExercise> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);
        const exercise = await mockExerciseService.getById(exerciseId);
        if (!exercise) {
            throw new Error(`Exercise not found: ${exerciseId}`);
        }

        const sessionExercise: SessionExercise = {
            id: uuidv4(),
            exerciseId,
            exercise,
            orderIndex: session.exercises.length,
            sets: [],
        };

        const updated: WorkoutSession = {
            ...session,
            exercises: [...session.exercises, sessionExercise],
            updatedAt: new Date(),
        };

        this.sessions.set(sessionId, updated);
        return sessionExercise;
    }

    async removeExercise(
        sessionId: string,
        sessionExerciseId: string
    ): Promise<void> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);
        const updated: WorkoutSession = {
            ...session,
            exercises: session.exercises
                .filter(e => e.id !== sessionExerciseId)
                .map((e, idx) => ({ ...e, orderIndex: idx })),
            updatedAt: new Date(),
        };

        this.sessions.set(sessionId, updated);
    }

    async reorderExercises(
        sessionId: string,
        exerciseIds: string[]
    ): Promise<WorkoutSession> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);
        const exerciseMap = new Map(session.exercises.map(e => [e.id, e]));

        const reordered = exerciseIds.map((id, idx) => {
            const exercise = exerciseMap.get(id);
            if (!exercise) throw new Error(`Exercise not found: ${id}`);
            return { ...exercise, orderIndex: idx };
        });

        const updated: WorkoutSession = {
            ...session,
            exercises: reordered,
            updatedAt: new Date(),
        };

        this.sessions.set(sessionId, updated);
        return updated;
    }

    async addSet(sessionId: string, sessionExerciseId: string, dto: CreateSetDTO): Promise<SetLog> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);
        const exercise = session.exercises.find(e => e.id === sessionExerciseId);
        if (!exercise) {
            throw new Error(`Session exercise not found: ${sessionExerciseId}`);
        }

        const newSet: SetLog = {
            id: uuidv4(),
            setNumber: getNextSetNumber(exercise.sets),
            reps: dto.reps,
            weight: dto.weight,
            notes: dto.notes,
            loggedAt: new Date(),
        };

        const updatedExercise: SessionExercise = {
            ...exercise,
            sets: [...exercise.sets, newSet],
        };

        const updated: WorkoutSession = {
            ...session,
            exercises: session.exercises.map(e =>
                e.id === sessionExerciseId ? updatedExercise : e
            ),
            updatedAt: new Date(),
        };

        this.sessions.set(session.id, updated);
        return newSet;
    }

    async updateSet(sessionId: string, setId: string, dto: UpdateSetDTO): Promise<SetLog> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);

        for (const exercise of session.exercises) {
            const setIdx = exercise.sets.findIndex(s => s.id === setId);
            if (setIdx !== -1) {
                const updatedSet: SetLog = {
                    ...exercise.sets[setIdx],
                    ...dto,
                };

                const updatedSets = [...exercise.sets];
                updatedSets[setIdx] = updatedSet;

                const updatedExercise: SessionExercise = {
                    ...exercise,
                    sets: updatedSets,
                };

                const updated: WorkoutSession = {
                    ...session,
                    exercises: session.exercises.map(e =>
                        e.id === exercise.id ? updatedExercise : e
                    ),
                    updatedAt: new Date(),
                };

                this.sessions.set(session.id, updated);
                return updatedSet;
            }
        }
        throw new Error(`Set not found: ${setId}`);
    }

    async deleteSet(sessionId: string, setId: string): Promise<void> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);

        for (const exercise of session.exercises) {
            const setIdx = exercise.sets.findIndex(s => s.id === setId);
            if (setIdx !== -1) {
                const updatedSets = exercise.sets
                    .filter(s => s.id !== setId)
                    .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

                const updatedExercise: SessionExercise = {
                    ...exercise,
                    sets: updatedSets,
                };

                const updated: WorkoutSession = {
                    ...session,
                    exercises: session.exercises.map(e =>
                        e.id === exercise.id ? updatedExercise : e
                    ),
                    updatedAt: new Date(),
                };

                this.sessions.set(session.id, updated);
                return;
            }
        }

        throw new Error(`Set not found: ${setId}`);
    }

    async reorderSets(
        sessionId: string,
        sessionExerciseId: string,
        setIds: string[]
    ): Promise<SetLog[]> {
        await delay(MOCK_LATENCY);

        const session = this.getSession(sessionId);
        const exerciseIdx = session.exercises.findIndex(e => e.id === sessionExerciseId);

        if (exerciseIdx !== -1) {
            const exercise = session.exercises[exerciseIdx];
            const setMap = new Map(exercise.sets.map(s => [s.id, s]));

            const reorderedSets = setIds.map((id, idx) => {
                const set = setMap.get(id);
                if (!set) throw new Error(`Set not found: ${id}`);
                return { ...set, setNumber: idx + 1 };
            });

            const updatedExercise: SessionExercise = {
                ...exercise,
                sets: reorderedSets,
            };

            const updated: WorkoutSession = {
                ...session,
                exercises: session.exercises.map(e =>
                    e.id === sessionExerciseId ? updatedExercise : e
                ),
                updatedAt: new Date(),
            };

            this.sessions.set(session.id, updated);
            return reorderedSets;
        }

        throw new Error(`Session exercise not found: ${sessionExerciseId}`);
    }
}

// Singleton instance for the mock service
export const mockSessionService = new MockSessionService();
