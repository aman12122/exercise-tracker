import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import type { Exercise } from '@/domain';
import { calculateSessionVolume } from '@/domain';
import { useAuthStore } from '@/store';
import { getDisplayWeight, formatWeight } from '@/lib/measurementUtils';
import {
    useSession,
    useStartSession,
    useCompleteSession,
    useAddExerciseToSession,
    useRemoveExerciseFromSession,
} from '@/hooks';
import { Button } from '@/components/common';
import { ExerciseSelector } from '@/features/exercises';
import { SessionExerciseCard } from '../SessionExerciseCard';
import styles from './WorkoutSessionView.module.css';

interface WorkoutSessionViewProps {
    sessionId: string;
}

const STATUS_LABELS: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    abandoned: 'Abandoned',
};

export function WorkoutSessionView({ sessionId }: WorkoutSessionViewProps) {
    const user = useAuthStore((state) => state.user);
    const weightUnit = user?.preferences?.weightUnit || 'lb';

    const { data: session, isLoading, error } = useSession(sessionId);
    const startSession = useStartSession();
    const completeSession = useCompleteSession();
    const addExercise = useAddExerciseToSession();
    const removeExercise = useRemoveExerciseFromSession();

    const [isExerciseSelectorOpen, setExerciseSelectorOpen] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Timer for in-progress sessions
    useEffect(() => {
        if (session?.status === 'in_progress' && session.startedAt) {
            const interval = setInterval(() => {
                const elapsed = Math.floor(
                    (Date.now() - new Date(session.startedAt!).getTime()) / 1000
                );
                setElapsedTime(elapsed);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [session?.status, session?.startedAt]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        startSession.mutate(sessionId);
    };

    const handleComplete = () => {
        if (confirm('Complete this workout?')) {
            completeSession.mutate(sessionId);
        }
    };

    // Toggle exercise: add if not present, remove if already added
    const handleAddExercise = (exercise: Exercise) => {
        const existing = session?.exercises.find(ex => ex.exerciseId === exercise.id);
        if (existing) {
            removeExercise.mutate({ sessionId, sessionExerciseId: existing.id });
        } else {
            addExercise.mutate({ sessionId, exerciseId: exercise.id });
        }
    };

    const totalVolumeDisplay = useMemo(() => {
        const volLbs = session ? calculateSessionVolume(session) : 0;
        return getDisplayWeight(volLbs, weightUnit);
    }, [session, weightUnit]);

    const totalSets = useMemo(() => {
        return session?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) ?? 0;
    }, [session]);

    const selectedExerciseIds = useMemo(() => {
        return session?.exercises.map((ex) => ex.exerciseId) ?? [];
    }, [session]);

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingSpinner} />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>❌</div>
                    <div className={styles.emptyTitle}>Session Not Found</div>
                    <div className={styles.emptyText}>
                        This workout session could not be loaded.
                    </div>
                </div>
            </div>
        );
    }

    const isActive = session.status === 'in_progress';
    const isEditable = session.status !== 'completed' && session.status !== 'abandoned';

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1 className={styles.title}>{session.name || 'Workout Session'}</h1>
                    <div className={styles.metaRow}>
                        <div className={styles.date}>
                            {format(new Date(session.sessionDate), 'EEEE, MMMM d')}
                        </div>
                        {session.type && (
                            <span className={styles.typeBadge}>
                                {session.type}
                            </span>
                        )}
                    </div>
                    {isActive && (
                        <div className={styles.timer}>{formatTime(elapsedTime)}</div>
                    )}
                </div>
                <div className={styles.headerActions}>
                    <span className={`${styles.status} ${styles[`status--${session.status}`]}`}>
                        {STATUS_LABELS[session.status]}
                    </span>
                </div>
            </header>

            {/* Summary Stats */}
            {session.exercises.length > 0 && (
                <div className={styles.summaryCard}>
                    <h2 className={styles.summaryTitle}>Session Summary</h2>
                    <div className={styles.summaryStats}>
                        <div className={styles.summaryStat}>
                            <div className={styles.statValue}>{session.exercises.length}</div>
                            <div className={styles.statLabel}>Exercises</div>
                        </div>
                        <div className={styles.summaryStat}>
                            <div className={styles.statValue}>{totalSets}</div>
                            <div className={styles.statLabel}>Sets</div>
                        </div>
                        <div className={styles.summaryStat}>
                            <div className={styles.statValue}>{formatWeight(totalVolumeDisplay, weightUnit)}</div>
                            <div className={styles.statLabel}>Total Volume</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Exercise List */}
            <div className={styles.exercises}>
                {session.exercises.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🏋️</div>
                        <div className={styles.emptyTitle}>No Exercises Yet</div>
                        <div className={styles.emptyText}>
                            Add exercises to start logging your workout
                        </div>
                        {isEditable && (
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => setExerciseSelectorOpen(true)}
                            >
                                + Add First Exercise
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {session.exercises.map((sessionExercise) => (
                            <SessionExerciseCard
                                key={sessionExercise.id}
                                sessionExercise={sessionExercise}
                                sessionId={sessionId}
                            />
                        ))}

                        {isEditable && (
                            <button
                                className={styles.addExerciseButton}
                                onClick={() => setExerciseSelectorOpen(true)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Exercise
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Footer Actions */}
            {isEditable && (
                <>
                    <div className={styles.footerSpacer} />
                    <footer className={styles.footer}>
                        {session.status === 'not_started' ? (
                            <Button
                                variant="success"
                                size="lg"
                                onClick={handleStart}
                                isLoading={startSession.isPending}
                            >
                                Start Workout
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleComplete}
                                isLoading={completeSession.isPending}
                                disabled={session.exercises.length === 0}
                            >
                                Complete Workout
                            </Button>
                        )}
                    </footer>
                </>
            )}

            {/* Exercise Selector Modal */}
            <ExerciseSelector
                isOpen={isExerciseSelectorOpen}
                onClose={() => setExerciseSelectorOpen(false)}
                onSelect={handleAddExercise}
                selectedIds={selectedExerciseIds}
            />
        </div>
    );
}
