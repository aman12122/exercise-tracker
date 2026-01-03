// Mock implementation of IExerciseService using in-memory storage
import { v4 as uuidv4 } from 'uuid';
import type {
    IExerciseService,
    DuplicateCheckResult,
} from '../interfaces/IExerciseService';
import type {
    Exercise,
    CreateExerciseDTO,
    UpdateExerciseDTO,
    MuscleGroup,
} from '@/domain';
import { DEFAULT_EXERCISES } from './defaultExercises';

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const MOCK_LATENCY = 200;

// Calculate string similarity (Levenshtein-based, normalized to 0-1)
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    // Simple containment check for partial matches
    if (longer.includes(shorter) || shorter.includes(longer)) {
        return 0.8;
    }

    // Calculate Levenshtein distance
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }

    return (longer.length - costs[s2.length]) / longer.length;
}

export class MockExerciseService implements IExerciseService {
    // In-memory store for user-created exercises
    private userExercises: Map<string, Exercise> = new Map();

    async getAll(): Promise<Exercise[]> {
        await delay(MOCK_LATENCY);
        const userExList = Array.from(this.userExercises.values()).filter(
            e => !e.isDeleted
        );
        const globalExList = DEFAULT_EXERCISES.filter(e => !e.isDeleted);
        return [...globalExList, ...userExList];
    }

    async getGlobalExercises(): Promise<Exercise[]> {
        await delay(MOCK_LATENCY);
        return DEFAULT_EXERCISES.filter(e => !e.isDeleted);
    }

    async getUserExercises(userId: string): Promise<Exercise[]> {
        await delay(MOCK_LATENCY);
        return Array.from(this.userExercises.values()).filter(
            e => e.userId === userId && !e.isDeleted
        );
    }

    async getById(id: string): Promise<Exercise | null> {
        await delay(MOCK_LATENCY / 2);

        // Check global exercises first
        const globalEx = DEFAULT_EXERCISES.find(e => e.id === id);
        if (globalEx) return globalEx;

        // Then check user exercises
        const userEx = this.userExercises.get(id);
        if (userEx && !userEx.isDeleted) return userEx;

        return null;
    }

    async create(userId: string, dto: CreateExerciseDTO): Promise<Exercise> {
        await delay(MOCK_LATENCY);

        const exercise: Exercise = {
            id: uuidv4(),
            ...dto,
            userId,
            isGlobal: false,
            isDeleted: false,
            createdAt: new Date(),
        };

        this.userExercises.set(exercise.id, exercise);
        return exercise;
    }

    async update(id: string, dto: UpdateExerciseDTO): Promise<Exercise> {
        await delay(MOCK_LATENCY);

        const exercise = this.userExercises.get(id);
        if (!exercise) {
            throw new Error('Exercise not found or is a global exercise');
        }

        const updated: Exercise = {
            ...exercise,
            ...dto,
        };

        this.userExercises.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<void> {
        await delay(MOCK_LATENCY);

        const exercise = this.userExercises.get(id);
        if (!exercise) {
            throw new Error('Exercise not found or is a global exercise');
        }

        // Soft delete
        this.userExercises.set(id, { ...exercise, isDeleted: true });
    }

    async search(query: string, userId?: string): Promise<Exercise[]> {
        await delay(MOCK_LATENCY);

        const lowerQuery = query.toLowerCase();
        const allExercises = await this.getAll();

        return allExercises.filter(e => {
            // Filter by user if specified (include global + user's exercises)
            if (userId && !e.isGlobal && e.userId !== userId) {
                return false;
            }

            return (
                e.name.toLowerCase().includes(lowerQuery) ||
                e.muscleGroup.toLowerCase().includes(lowerQuery) ||
                e.equipment?.toLowerCase().includes(lowerQuery)
            );
        });
    }

    async filterByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
        await delay(MOCK_LATENCY);

        const allExercises = await this.getAll();
        return allExercises.filter(
            e =>
                e.muscleGroup === muscleGroup ||
                e.secondaryMuscles?.includes(muscleGroup)
        );
    }

    async checkForDuplicates(
        name: string,
        _userId: string
    ): Promise<DuplicateCheckResult> {
        await delay(MOCK_LATENCY);

        const allExercises = await this.getAll();
        const lowerName = name.toLowerCase().trim();

        // Check for exact match
        const exactMatch = allExercises.find(
            e => e.name.toLowerCase().trim() === lowerName
        );

        if (exactMatch) {
            return {
                hasDuplicate: true,
                exactMatch,
                similarMatches: [],
            };
        }

        // Check for similar matches (>80% similarity)
        const similarMatches = allExercises.filter(e => {
            const similarity = calculateSimilarity(e.name, name);
            return similarity >= 0.7 && similarity < 1;
        });

        return {
            hasDuplicate: similarMatches.length > 0,
            similarMatches,
        };
    }
}

// Singleton instance for the mock service
export const mockExerciseService = new MockExerciseService();
