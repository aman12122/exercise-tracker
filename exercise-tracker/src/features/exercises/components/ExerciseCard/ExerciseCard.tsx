import type { Exercise } from '@/domain';
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
            {/* Visual Section */}
            <div className={styles.visualSection}>
                <div className={`${styles.iconWrapper} ${styles[`iconWrapper${capitalize(exercise.muscleGroup)}`]}`}>
                    <MuscleGroupIcon muscle={exercise.muscleGroup} size={48} />
                </div>

                {showAddButton && !isSelected && (
                    <div className={styles.addButton}>
                        +
                    </div>
                )}

                {/* Selection Overlay/Indicator */}
                {isSelected && (
                    <div className={styles.selectedOverlay}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className={styles.infoSection}>
                <div className={styles.name}>{exercise.name.toUpperCase()}</div>
                <div className={styles.meta}>
                    <span className={styles.categoryName}>
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                        {exercise.equipment && ` · ${EQUIPMENT_LABELS[exercise.equipment]}`}
                    </span>
                    {!exercise.isGlobal && (
                        <span className={styles.customBadge}>CUSTOM</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace('_', '');
}
