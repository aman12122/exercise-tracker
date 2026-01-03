/**
 * Exercise History Service
 * 
 * Provides progress tracking capabilities:
 * - Last time an exercise was performed
 * - Progress over time for an exercise
 * - Volume per week/month
 * - PRs / max / estimated 1RM
 */

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SessionExercise, SetLog } from '@/domain';
import { calculateEstimated1RM, findBestSet } from '@/domain';

export interface ExerciseHistoryEntry {
    sessionId: string;
    sessionDate: Date;
    exerciseId: string;
    exerciseName: string;
    sets: SetLog[];
    totalVolume: number;        // Sum of (reps × weight) for all sets
    totalReps: number;
    bestSet: SetLog | null;
    estimated1RM: number;       // From best set
}

export interface ExerciseStats {
    exerciseId: string;
    exerciseName: string;
    prWeight: number;           // Heaviest weight lifted
    prReps: number;             // Reps at that PR weight
    prDate: Date | null;
    estimated1RM: number;       // Best estimated 1RM ever
    totalSessions: number;      // Number of sessions containing this exercise
    lastPerformed: Date | null;
    totalVolume: number;        // All-time volume
}

export interface VolumeAggregate {
    period: string;             // e.g., "2025-W1" or "2025-01"
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    sessionCount: number;
}

export interface DashboardSummary {
    totalWorkouts: number;
    totalVolume: number;        // All-time volume in lbs
    currentStreak: number;      // Consecutive days with workouts
    longestStreak: number;
    weeklyVolume: number;       // Last 7 days
    monthlyVolume: number;      // Last 30 days
    recentWorkouts: Array<{
        date: Date;
        name: string;
        type?: string;
        sessionId: string;
    }>;
    topExercises: Array<{
        exerciseId: string;
        exerciseName: string;
        count: number;
    }>;
}

class FirebaseExerciseHistoryService {

    /**
     * Get exercise history for a specific exercise
     * Returns all sessions where this exercise was performed, ordered by date desc
     */
    async getExerciseHistory(
        userId: string,
        exerciseId: string,
        limit?: number
    ): Promise<ExerciseHistoryEntry[]> {
        if (!db) throw new Error("Firebase DB not initialized");

        // Get all sessions, then filter for those containing this exercise
        // Note: Firestore doesn't support querying on nested array fields efficiently
        // So we fetch sessions and filter client-side
        const q = query(
            collection(db, 'users', userId, 'workoutSessions'),
            where('status', '==', 'completed'),
            orderBy('sessionDate', 'desc')
        );

        const snaps = await getDocs(q);
        const entries: ExerciseHistoryEntry[] = [];

        for (const doc of snaps.docs) {
            const data = doc.data();
            const exercises = data.exercises || [];

            const matchingExercise = exercises.find(
                (ex: SessionExercise) => ex.exerciseId === exerciseId
            );

            if (matchingExercise) {
                const sets = matchingExercise.sets || [];
                const totalVolume = sets.reduce(
                    (sum: number, s: SetLog) => sum + (s.reps * s.weight),
                    0
                );
                const totalReps = sets.reduce(
                    (sum: number, s: SetLog) => sum + s.reps,
                    0
                );
                const bestSet = findBestSet(sets);

                entries.push({
                    sessionId: doc.id,
                    sessionDate: data.sessionDate?.toDate?.() || new Date(data.sessionDate),
                    exerciseId,
                    exerciseName: matchingExercise.exercise?.name || 'Unknown',
                    sets,
                    totalVolume,
                    totalReps,
                    bestSet,
                    estimated1RM: bestSet
                        ? calculateEstimated1RM(bestSet.weight, bestSet.reps)
                        : 0
                });

                if (limit && entries.length >= limit) break;
            }
        }

        return entries;
    }

    /**
     * Get the last time an exercise was performed
     */
    async getLastPerformed(
        userId: string,
        exerciseId: string
    ): Promise<ExerciseHistoryEntry | null> {
        const history = await this.getExerciseHistory(userId, exerciseId, 1);
        return history[0] || null;
    }

    /**
     * Get overall stats for an exercise (PR, total sessions, etc.)
     */
    async getExerciseStats(
        userId: string,
        exerciseId: string
    ): Promise<ExerciseStats> {
        const history = await this.getExerciseHistory(userId, exerciseId);

        const stats: ExerciseStats = {
            exerciseId,
            exerciseName: history[0]?.exerciseName || 'Unknown',
            prWeight: 0,
            prReps: 0,
            prDate: null,
            estimated1RM: 0,
            totalSessions: history.length,
            lastPerformed: history[0]?.sessionDate || null,
            totalVolume: 0
        };

        for (const entry of history) {
            stats.totalVolume += entry.totalVolume;

            if (entry.estimated1RM > stats.estimated1RM) {
                stats.estimated1RM = entry.estimated1RM;
                if (entry.bestSet) {
                    stats.prWeight = entry.bestSet.weight;
                    stats.prReps = entry.bestSet.reps;
                    stats.prDate = entry.sessionDate;
                }
            }
        }

        return stats;
    }

    /**
     * Get volume aggregated by week or month
     */
    async getVolumeByPeriod(
        userId: string,
        periodType: 'week' | 'month',
        startDate?: Date,
        endDate?: Date
    ): Promise<VolumeAggregate[]> {
        if (!db) throw new Error("Firebase DB not initialized");

        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), 0, 1); // Default: start of year
        const end = endDate || now;

        const q = query(
            collection(db, 'users', userId, 'workoutSessions'),
            where('status', '==', 'completed'),
            where('sessionDate', '>=', Timestamp.fromDate(start)),
            where('sessionDate', '<=', Timestamp.fromDate(end)),
            orderBy('sessionDate', 'asc')
        );

        const snaps = await getDocs(q);
        const aggregates = new Map<string, VolumeAggregate>();

        for (const doc of snaps.docs) {
            const data = doc.data();
            const sessionDate = data.sessionDate?.toDate?.() || new Date(data.sessionDate);

            // Generate period key
            let periodKey: string;
            if (periodType === 'week') {
                const weekNum = getWeekNumber(sessionDate);
                periodKey = `${sessionDate.getFullYear()}-W${weekNum}`;
            } else {
                periodKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!aggregates.has(periodKey)) {
                aggregates.set(periodKey, {
                    period: periodKey,
                    totalVolume: 0,
                    totalSets: 0,
                    totalReps: 0,
                    sessionCount: 0
                });
            }

            const agg = aggregates.get(periodKey)!;
            agg.sessionCount += 1;

            const exercises = data.exercises || [];
            for (const ex of exercises) {
                const sets = ex.sets || [];
                for (const set of sets) {
                    agg.totalVolume += (set.reps || 0) * (set.weight || 0);
                    agg.totalReps += set.reps || 0;
                    agg.totalSets += 1;
                }
            }
        }

        return Array.from(aggregates.values());
    }

    /**
     * Get dashboard summary with key metrics
     */
    /**
     * Get dashboard summary with key metrics
     * Reads pre-calculated stats from 'users/{userId}/stats/dashboard'
     */
    async getDashboardSummary(userId: string): Promise<DashboardSummary> {
        if (!db) throw new Error("Firebase DB not initialized");

        // Simple optimized read: O(1) instead of O(N)
        const statsRef = doc(db, 'users', userId, 'stats', 'dashboard');
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
            const data = statsSnap.data();
            // Convert Firestore timestamps back to Dates for the frontend
            return {
                ...data,
                // Ensure dates are parsed correctly
                recentWorkouts: (data.recentWorkouts || []).map((w: any) => ({
                    ...w,
                    date: w.date?.toDate ? w.date.toDate() : new Date(w.date)
                }))
            } as DashboardSummary;
        }

        // Fallback if stats haven't been generated yet (new user or before first function run)
        return {
            totalWorkouts: 0,
            totalVolume: 0,
            currentStreak: 0,
            longestStreak: 0,
            weeklyVolume: 0,
            monthlyVolume: 0,
            recentWorkouts: [],
            topExercises: []
        };
    }
}

// Helper: Get ISO week number
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export const firebaseExerciseHistoryService = new FirebaseExerciseHistoryService();
