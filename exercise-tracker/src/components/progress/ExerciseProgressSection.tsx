/**
 * Exercise Progress Section
 * 
 * Displays a progress tracking UI with:
 * - Exercise dropdown selector
 * - Line chart showing best set weight over time
 * - Stats cards (PR, volume, sessions, last performed)
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useExerciseHistory, useExerciseStats, useDashboardSummary } from '@/hooks';
import { useAuthStore } from '@/store';
import { getDisplayWeight, formatWeight } from '@/lib/measurementUtils';
import { ProgressChart } from './ProgressChart';
import { StatsRow } from './StatsRow';
import styles from './ExerciseProgressSection.module.css';

export function ExerciseProgressSection() {
    const user = useAuthStore(state => state.user);
    const weightUnit = user?.preferences?.weightUnit || 'lb';

    // Get top exercises from dashboard summary
    const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
    const topExercises = summary?.topExercises || [];

    // Selected exercise state
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

    // Auto-select first exercise when data loads
    const exerciseId = selectedExerciseId || topExercises[0]?.exerciseId || '';

    // Get history and stats for selected exercise
    const { data: history = [], isLoading: historyLoading } = useExerciseHistory(exerciseId);
    const { data: stats } = useExerciseStats(exerciseId);

    // Transform history for chart (best set weight per session)
    const chartData = useMemo(() => {
        return history
            .filter(entry => entry.bestSet)
            .map(entry => ({
                date: entry.sessionDate,
                value: getDisplayWeight(entry.bestSet!.weight, weightUnit),
                label: `${entry.bestSet!.reps} reps @ ${formatWeight(
                    getDisplayWeight(entry.bestSet!.weight, weightUnit),
                    weightUnit
                )}`
            }))
            .reverse(); // Oldest first for chart
    }, [history, weightUnit]);

    // Loading state
    if (summaryLoading) {
        return (
            <section className={styles.container}>
                <div className={styles.loading}>Loading progress data...</div>
            </section>
        );
    }

    // Empty state - no workouts yet
    if (topExercises.length === 0) {
        return (
            <section className={styles.container}>
                <h2 className={styles.title}>Progress Tracking</h2>
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📈</span>
                    <p>Complete a workout to see your progress!</p>
                </div>
            </section>
        );
    }

    const selectedExerciseName = topExercises.find(e => e.exerciseId === exerciseId)?.exerciseName || 'Exercise';

    return (
        <section className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Progress Tracking</h2>
                <select
                    className={styles.selector}
                    value={exerciseId}
                    onChange={e => setSelectedExerciseId(e.target.value)}
                >
                    {topExercises.map(ex => (
                        <option key={ex.exerciseId} value={ex.exerciseId}>
                            {ex.exerciseName}
                        </option>
                    ))}
                </select>
            </div>

            {historyLoading ? (
                <div className={styles.loading}>Loading chart...</div>
            ) : chartData.length < 2 ? (
                <div className={styles.empty}>
                    <p>Need at least 2 sessions with {selectedExerciseName} to show progress</p>
                </div>
            ) : (
                <ProgressChart
                    data={chartData}
                    unit={weightUnit}
                    exerciseName={selectedExerciseName}
                />
            )}

            {stats && (
                <StatsRow
                    prWeight={stats.prWeight}
                    prReps={stats.prReps}
                    prDate={stats.prDate}
                    totalVolume={stats.totalVolume}
                    totalSessions={stats.totalSessions}
                    lastPerformed={stats.lastPerformed}
                    weightUnit={weightUnit}
                />
            )}
        </section>
    );
}
