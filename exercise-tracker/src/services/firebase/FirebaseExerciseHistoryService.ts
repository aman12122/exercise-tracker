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
    Timestamp
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
    async getDashboardSummary(userId: string): Promise<DashboardSummary> {
        if (!db) throw new Error("Firebase DB not initialized");

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get all completed sessions
        const q = query(
            collection(db, 'users', userId, 'workoutSessions'),
            where('status', '==', 'completed'),
            orderBy('sessionDate', 'desc')
        );

        const snaps = await getDocs(q);

        let totalVolume = 0;
        let weeklyVolume = 0;
        let monthlyVolume = 0;
        const exerciseCounts = new Map<string, { name: string; count: number }>();
        const recentWorkouts: DashboardSummary['recentWorkouts'] = [];
        const workoutDates: Date[] = [];

        for (const doc of snaps.docs) {
            const data = doc.data();
            const sessionDate = data.sessionDate?.toDate?.() || new Date(data.sessionDate);
            workoutDates.push(sessionDate);

            // Calculate volume
            let sessionVolume = 0;
            const exercises = data.exercises || [];
            for (const ex of exercises) {
                const exId = ex.exerciseId;
                const exName = ex.exercise?.name || 'Unknown';

                if (!exerciseCounts.has(exId)) {
                    exerciseCounts.set(exId, { name: exName, count: 0 });
                }
                exerciseCounts.get(exId)!.count += 1;

                const sets = ex.sets || [];
                for (const set of sets) {
                    sessionVolume += (set.reps || 0) * (set.weight || 0);
                }
            }

            totalVolume += sessionVolume;

            if (sessionDate >= sevenDaysAgo) {
                weeklyVolume += sessionVolume;
            }
            if (sessionDate >= thirtyDaysAgo) {
                monthlyVolume += sessionVolume;
            }

            // Recent workouts (max 5)
            if (recentWorkouts.length < 5) {
                recentWorkouts.push({
                    date: sessionDate,
                    name: data.name || 'Workout',
                    type: data.type,
                    sessionId: doc.id
                });
            }
        }

        // Calculate streaks
        const { currentStreak, longestStreak } = calculateStreaks(workoutDates);

        // Top 5 exercises
        const topExercises = Array.from(exerciseCounts.entries())
            .map(([id, data]) => ({
                exerciseId: id,
                exerciseName: data.name,
                count: data.count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalWorkouts: snaps.size,
            totalVolume,
            currentStreak,
            longestStreak,
            weeklyVolume,
            monthlyVolume,
            recentWorkouts,
            topExercises
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

// Helper: Calculate current and longest streaks
function calculateStreaks(dates: Date[]): { currentStreak: number; longestStreak: number } {
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Normalize to date strings and dedupe
    const uniqueDays = [...new Set(
        dates.map(d => d.toISOString().split('T')[0])
    )].sort().reverse(); // Most recent first

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Check if today or yesterday has a workout to start current streak
    const hasToday = uniqueDays[0] === today;
    const hasYesterday = uniqueDays[0] === yesterday || uniqueDays[1] === yesterday;

    for (const dateStr of uniqueDays) {
        const d = new Date(dateStr);

        if (lastDate === null) {
            tempStreak = 1;
        } else {
            const diff = (lastDate.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
            if (diff <= 1.5) { // Allow for timezone variations
                tempStreak += 1;
            } else {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 1;
            }
        }
        lastDate = d;
    }

    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Current streak is only valid if most recent workout was today or yesterday
    if (hasToday || hasYesterday) {
        currentStreak = tempStreak;
        // Recount from the most recent date
        let streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
            const curr = new Date(uniqueDays[i - 1]);
            const prev = new Date(uniqueDays[i]);
            const diff = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
            if (diff <= 1.5) {
                streak += 1;
            } else {
                break;
            }
        }
        currentStreak = streak;
    }

    return { currentStreak, longestStreak };
}

export const firebaseExerciseHistoryService = new FirebaseExerciseHistoryService();
