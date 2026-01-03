import { useMemo, useState } from 'react';
import type { Exercise, MuscleGroup } from '@/domain';
import { MUSCLE_GROUP_LABELS } from '@/domain';
import { useExercises } from '@/hooks';
import { SearchInput, MuscleGroupIcon } from '@/components/common';
import { ExerciseCard } from '../ExerciseCard';
import styles from './ExerciseList.module.css';

interface ExerciseListProps {
    selectedIds?: string[];
    onSelect?: (exercise: Exercise) => void;
    showAddButton?: boolean;
    isCompact?: boolean;
    groupByMuscle?: boolean;
    muscleFilter?: MuscleGroup | null;
    hideFilters?: boolean;
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
    muscleFilter: externalMuscleFilter,
    hideFilters = false,
}: ExerciseListProps) {
    const { data: exercises, isLoading, error } = useExercises();
    const [searchQuery, setSearchQuery] = useState('');
    const [internalMuscleFilter, setInternalMuscleFilter] = useState<MuscleGroup | null>(null);

    // Use external filter if provided, otherwise use internal
    const muscleFilter = externalMuscleFilter !== undefined ? externalMuscleFilter : internalMuscleFilter;

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
                <span className={styles.errorIcon}>⚠️</span>
                <span>Failed to load exercises. Please try again.</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Search Bar */}
            <div className={styles.searchWrapper}>
                <SearchInput
                    placeholder="Search exercises by name, muscle, or equipment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Filter Chips (only show if not controlled externally and not hidden) */}
            {!hideFilters && externalMuscleFilter === undefined && (
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterChip} ${!muscleFilter ? styles.filterChipActive : ''}`}
                        onClick={() => setInternalMuscleFilter(null)}
                    >
                        All
                    </button>
                    {MUSCLE_GROUP_ORDER.map((muscle) => (
                        <button
                            key={muscle}
                            className={`${styles.filterChip} ${muscleFilter === muscle ? styles.filterChipActive : ''}`}
                            onClick={() => setInternalMuscleFilter(muscle)}
                        >
                            <MuscleGroupIcon muscle={muscle} size={14} />
                            {MUSCLE_GROUP_LABELS[muscle]}
                        </button>
                    ))}
                </div>
            )}

            {isLoading ? (
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner} />
                    <span>Loading exercises...</span>
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
            ) : groupByMuscle && !muscleFilter ? (
                <div className={styles.list}>
                    {MUSCLE_GROUP_ORDER.filter((muscle) => groupedExercises[muscle]?.length).map(
                        (muscle, groupIndex) => (
                            <div
                                key={muscle}
                                className={styles.group}
                                style={{ animationDelay: `${groupIndex * 0.05}s` }}
                            >
                                <div className={styles.groupHeader}>
                                    <div className={styles.groupHeaderContent}>
                                        <MuscleGroupIcon muscle={muscle} size={20} />
                                        <span>{MUSCLE_GROUP_LABELS[muscle]}</span>
                                    </div>
                                    <span className={styles.groupCount}>
                                        {groupedExercises[muscle].length}
                                    </span>
                                </div>
                                <div className={styles.groupItems}>
                                    {groupedExercises[muscle].map((exercise, index) => (
                                        <ExerciseCard
                                            key={exercise.id}
                                            exercise={exercise}
                                            isSelected={selectedIds.includes(exercise.id)}
                                            isCompact={isCompact}
                                            showAddButton={showAddButton}
                                            onClick={() => onSelect?.(exercise)}
                                            animationDelay={index * 0.03}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            ) : (
                <div className={styles.flatList}>
                    {filteredExercises.map((exercise, index) => (
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            isSelected={selectedIds.includes(exercise.id)}
                            isCompact={isCompact}
                            showAddButton={showAddButton}
                            onClick={() => onSelect?.(exercise)}
                            animationDelay={index * 0.03}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
