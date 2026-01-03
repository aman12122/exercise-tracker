import type { Exercise, MuscleGroup } from '@/domain';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '@/domain';
import styles from './ExerciseCard.module.css';

interface ExerciseCardProps {
    exercise: Exercise;
    isSelected?: boolean;
    isCompact?: boolean;
    showAddButton?: boolean;
    onClick?: () => void;
}

const MUSCLE_ICONS: Record<MuscleGroup, string> = {
    chest: '💪',
    back: '🔙',
    shoulders: '🎯',
    biceps: '💪',
    triceps: '💪',
    forearms: '🦾',
    quadriceps: '🦵',
    hamstrings: '🦵',
    glutes: '🍑',
    calves: '🦶',
    core: '🔥',
    full_body: '🏋️',
};

export function ExerciseCard({
    exercise,
    isSelected = false,
    isCompact = false,
    showAddButton = false,
    onClick,
}: ExerciseCardProps) {
    const classNames = [
        styles.exerciseCard,
        isSelected && styles['exerciseCard--selected'],
        isCompact && styles['exerciseCard--compact'],
    ]
        .filter(Boolean)
        .join(' ');

    const iconClassNames = [
        styles.muscleIcon,
        styles[`muscleIcon--${exercise.muscleGroup}`],
    ].join(' ');

    return (
        <div
            className={classNames}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            <div className={iconClassNames}>
                {MUSCLE_ICONS[exercise.muscleGroup]}
            </div>

            <div className={styles.content}>
                <div className={styles.name}>{exercise.name}</div>
                <div className={styles.meta}>
                    <span className={styles.tag}>
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                    </span>
                    {exercise.equipment && (
                        <span className={styles.tag}>
                            {EQUIPMENT_LABELS[exercise.equipment]}
                        </span>
                    )}
                    {!exercise.isGlobal && (
                        <span className={`${styles.tag} ${styles['tag--custom']}`}>
                            Custom
                        </span>
                    )}
                </div>
            </div>

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
        </div>
    );
}
