import { useState } from 'react';
import type { SessionExercise } from '@/domain';
import { calculateExerciseVolume, MUSCLE_GROUP_LABELS } from '@/domain';
import { useRemoveExerciseFromSession } from '@/hooks';
import { useAuthStore } from '@/store';
import { getDisplayWeight, formatWeight } from '@/lib/measurementUtils';
import { SetLogger } from '../SetLogger';
import styles from './SessionExerciseCard.module.css';

interface SessionExerciseCardProps {
    sessionExercise: SessionExercise;
    sessionId: string;
    isExpanded?: boolean;
}

export function SessionExerciseCard({
    sessionExercise,
    sessionId,
    isExpanded: initialExpanded = true,
}: SessionExerciseCardProps) {
    const user = useAuthStore((state) => state.user);
    const weightUnit = user?.preferences?.weightUnit || 'lb';

    const [isExpanded, setIsExpanded] = useState(initialExpanded);
    const removeExercise = useRemoveExerciseFromSession();

    const handleRemove = () => {
        if (confirm('Remove this exercise from the session?')) {
            removeExercise.mutate({
                sessionId,
                sessionExerciseId: sessionExercise.id,
            });
        }
    };

    const volumeLbs = calculateExerciseVolume(sessionExercise.sets);
    const volumeDisplay = getDisplayWeight(volumeLbs, weightUnit);
    const setCount = sessionExercise.sets.length;

    return (
        <div className={styles.sessionExercise}>
            <div className={styles.header}>
                <div className={styles.exerciseInfo}>
                    <button
                        className={styles.orderHandle}
                        aria-label="Drag to reorder"
                        title="Drag to reorder"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="8" y2="6.01" />
                            <line x1="8" y1="12" x2="8" y2="12.01" />
                            <line x1="8" y1="18" x2="8" y2="18.01" />
                            <line x1="16" y1="6" x2="16" y2="6.01" />
                            <line x1="16" y1="12" x2="16" y2="12.01" />
                            <line x1="16" y1="18" x2="16" y2="18.01" />
                        </svg>
                    </button>
                    <div>
                        <div className={styles.exerciseName}>
                            {sessionExercise.exercise.name}
                        </div>
                        <div className={styles.exerciseMeta}>
                            {MUSCLE_GROUP_LABELS[sessionExercise.exercise.muscleGroup]}
                        </div>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button
                        className={styles.actionButton}
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                            }}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    <button
                        className={`${styles.actionButton} ${styles['actionButton--delete']}`}
                        onClick={handleRemove}
                        disabled={removeExercise.isPending}
                        aria-label="Remove exercise"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </button>
                </div>
            </div>

            {isExpanded ? (
                <div className={styles.body}>
                    <SetLogger
                        sessionExerciseId={sessionExercise.id}
                        sessionId={sessionId}
                        sets={sessionExercise.sets}
                    />
                </div>
            ) : (
                <div
                    className={styles.collapsed}
                    onClick={() => setIsExpanded(true)}
                >
                    {setCount} sets • {formatWeight(volumeDisplay, weightUnit)} volume
                </div>
            )}

            {isExpanded && setCount > 0 && (
                <div className={styles.summary}>
                    <div className={styles.summaryItem}>
                        Sets: <span className={styles.summaryValue}>{setCount}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        Volume: <span className={styles.summaryValue}>{formatWeight(volumeDisplay, weightUnit)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
