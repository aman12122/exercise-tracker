import type { Exercise, MuscleGroup } from '@/domain';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '@/domain';
import { MuscleGroupIcon } from '@/components/common';
import styles from './ExerciseCard.module.css';

interface ExerciseCardProps {
    exercise: Exercise;
    isSelected?: boolean;
    isCompact?: boolean;
    showAddButton?: boolean;
    onClick?: () => void;
    animationDelay?: number;
}

export function ExerciseCard({
    exercise,
    isSelected = false,
    isCompact = false,
    showAddButton = false,
    onClick,
    animationDelay = 0,
}: ExerciseCardProps) {
    const classNames = [
        styles.exerciseCard,
        isSelected && styles.exerciseCardSelected,
        isCompact && styles.exerciseCardCompact,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={classNames}
            onClick={onClick}
            role="button"
            tabIndex={0}
            style={{ animationDelay: `${animationDelay}s` }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            {/* Muscle Icon */}
            <div className={`${styles.iconWrapper} ${styles[`iconWrapper${capitalize(exercise.muscleGroup)}`]}`}>
                <MuscleGroupIcon muscle={exercise.muscleGroup} size={isCompact ? 20 : 24} />
            </div>

            {/* Content */}
            <div className={styles.content}>
                <div className={styles.name}>{exercise.name}</div>
                <div className={styles.meta}>
                    <span className={styles.tag}>
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                    </span>
                    {exercise.equipment && (
                        <span className={styles.tag}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 5v14M18 5v14M6 12h12M3 5v4M21 5v4M3 15v4M21 15v4" />
                            </svg>
                            {EQUIPMENT_LABELS[exercise.equipment]}
                        </span>
                    )}
                    {!exercise.isGlobal && (
                        <span className={`${styles.tag} ${styles.tagCustom}`}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Custom
                        </span>
                    )}
                </div>
            </div>

            {/* Action Button */}
            {isSelected && (
                <div className={styles.checkmark}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
            )}

            {showAddButton && !isSelected && (
                <div className={styles.addButton}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </div>
            )}

            {/* Hover Glow Effect */}
            <div className={styles.glowEffect} />
        </div>
    );
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace('_', '');
}
