import { useState } from 'react';
import { Button, Modal, MuscleGroupIcon } from '@/components/common';
import { ExerciseList, CreateExerciseForm } from '@/features/exercises';
import { useExercises } from '@/hooks';
import type { MuscleGroup } from '@/domain';
import { MUSCLE_GROUP_LABELS } from '@/domain';
import styles from './ExercisesPage.module.css';

const MUSCLE_GROUPS: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'quadriceps', 'hamstrings', 'glutes', 'core', 'full_body'
];

export function ExercisesPage() {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
    const { data: exercises } = useExercises();

    // Count exercises by muscle group
    const muscleGroupCounts = exercises?.reduce((acc, ex) => {
        acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) ?? {};

    const totalExercises = exercises?.length ?? 0;
    const customExercises = exercises?.filter(ex => !ex.isGlobal).length ?? 0;

    return (
        <div className={styles.pageWrapper}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroBadge}>
                        <span className={styles.heroBadgeIcon}>💎</span>
                        <span>Exercise Library</span>
                    </div>
                    <h1 className={styles.heroTitle}>
                        Master Your <span className={styles.heroTitleAccent}>Training</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Explore our curated collection of exercises. Filter by muscle group, search by name, or create your own.
                    </p>

                    {/* Stats Row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{totalExercises}</span>
                            <span className={styles.statLabel}>Total Exercises</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{Object.keys(muscleGroupCounts).length}</span>
                            <span className={styles.statLabel}>Muscle Groups</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>{customExercises}</span>
                            <span className={styles.statLabel}>Custom</span>
                        </div>
                    </div>
                </div>

                {/* Create Button */}
                <Button
                    variant="primary"
                    onClick={() => setCreateModalOpen(true)}
                    className={styles.createButton}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create Exercise
                </Button>
            </div>

            {/* Category Cards */}
            <section className={styles.categoriesSection}>
                <h2 className={styles.sectionTitle}>Browse by Muscle Group</h2>
                <div className={styles.categoriesGrid}>
                    {MUSCLE_GROUPS.map((muscle) => (
                        <button
                            key={muscle}
                            className={`${styles.categoryCard} ${selectedMuscle === muscle ? styles.categoryCardActive : ''}`}
                            onClick={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
                        >
                            <div className={styles.categoryIconWrapper}>
                                <MuscleGroupIcon muscle={muscle} size={32} />
                            </div>
                            <span className={styles.categoryName}>{MUSCLE_GROUP_LABELS[muscle]}</span>
                            <span className={styles.categoryCount}>{muscleGroupCounts[muscle] || 0}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Exercise List Section */}
            <section className={styles.exercisesSection}>
                <div className={styles.exercisesHeader}>
                    <h2 className={styles.sectionTitle}>
                        {selectedMuscle
                            ? `${MUSCLE_GROUP_LABELS[selectedMuscle]} Exercises`
                            : 'All Exercises'}
                    </h2>
                    {selectedMuscle && (
                        <button
                            className={styles.clearFilter}
                            onClick={() => setSelectedMuscle(null)}
                        >
                            Clear Filter ✕
                        </button>
                    )}
                </div>
                <ExerciseList
                    groupByMuscle={!selectedMuscle}
                    muscleFilter={selectedMuscle}
                />
            </section>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create Custom Exercise"
                size="md"
            >
                <CreateExerciseForm
                    onSuccess={() => setCreateModalOpen(false)}
                    onCancel={() => setCreateModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
