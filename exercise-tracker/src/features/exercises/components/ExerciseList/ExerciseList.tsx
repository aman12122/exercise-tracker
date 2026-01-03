import { useMemo, useState } from 'react';
import type { Exercise, MuscleGroup } from '@/domain';
import { MUSCLE_GROUP_LABELS } from '@/domain';
import { useExercises } from '@/hooks';
import { SearchInput } from '@/components/common';
import { ExerciseCard } from '../ExerciseCard';
import styles from './ExerciseList.module.css';

interface ExerciseListProps {
    selectedIds?: string[];
    onSelect?: (exercise: Exercise) => void;
    showAddButton?: boolean;
    isCompact?: boolean;
    groupByMuscle?: boolean;
}

const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'forearms',
    'quadriceps',
    'hamstrings',
    'glutes',
    'calves',
    'core',
    'full_body',
];

export function ExerciseList({
    selectedIds = [],
    onSelect,
    showAddButton = false,
    isCompact = false,
    groupByMuscle = true,
}: ExerciseListProps) {
    const { data: exercises, isLoading, error } = useExercises();
    const [searchQuery, setSearchQuery] = useState('');
    const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);

    const filteredExercises = useMemo(() => {
        if (!exercises) return [];

        let result = exercises;

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (ex) =>
                    ex.name.toLowerCase().includes(query) ||
                    ex.muscleGroup.toLowerCase().includes(query) ||
                    ex.equipment?.toLowerCase().includes(query)
            );
        }

        // Apply muscle group filter
        if (muscleFilter) {
            result = result.filter(
                (ex) =>
                    ex.muscleGroup === muscleFilter ||
                    ex.secondaryMuscles?.includes(muscleFilter)
            );
        }

        return result;
    }, [exercises, searchQuery, muscleFilter]);

    const groupedExercises = useMemo(() => {
        if (!groupByMuscle) return { all: filteredExercises };

        return filteredExercises.reduce(
            (groups, exercise) => {
                const group = exercise.muscleGroup;
                if (!groups[group]) {
                    groups[group] = [];
                }
                groups[group].push(exercise);
                return groups;
            },
            {} as Record<string, Exercise[]>
        );
    }, [filteredExercises, groupByMuscle]);

    if (error) {
        return (
            <div className={styles.error}>
                Failed to load exercises. Please try again.
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <SearchInput
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className={styles.filters}>
                <button
                    className={`${styles.filterChip} ${!muscleFilter ? styles['filterChip--active'] : ''}`}
                    onClick={() => setMuscleFilter(null)}
                >
                    All
                </button>
                {MUSCLE_GROUP_ORDER.map((muscle) => (
                    <button
                        key={muscle}
                        className={`${styles.filterChip} ${muscleFilter === muscle ? styles['filterChip--active'] : ''}`}
                        onClick={() => setMuscleFilter(muscle)}
                    >
                        {MUSCLE_GROUP_LABELS[muscle]}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner} />
                </div>
            ) : filteredExercises.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🔍</div>
                    <div className={styles.emptyText}>No exercises found</div>
                    <div className={styles.emptySubtext}>
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Create your first custom exercise'}
                    </div>
                </div>
            ) : groupByMuscle ? (
                <div className={styles.list}>
                    {MUSCLE_GROUP_ORDER.filter((muscle) => groupedExercises[muscle]?.length).map(
                        (muscle) => (
                            <div key={muscle}>
                                <div className={styles.groupHeader}>
                                    {MUSCLE_GROUP_LABELS[muscle]} ({groupedExercises[muscle].length})
                                </div>
                                {groupedExercises[muscle].map((exercise) => (
                                    <ExerciseCard
                                        key={exercise.id}
                                        exercise={exercise}
                                        isSelected={selectedIds.includes(exercise.id)}
                                        isCompact={isCompact}
                                        showAddButton={showAddButton}
                                        onClick={() => onSelect?.(exercise)}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            ) : (
                <div className={styles.list}>
                    {filteredExercises.map((exercise) => (
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            isSelected={selectedIds.includes(exercise.id)}
                            isCompact={isCompact}
                            showAddButton={showAddButton}
                            onClick={() => onSelect?.(exercise)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
