import { useState } from 'react';
import { Button, Modal } from '@/components/common';
import { ExerciseList, CreateExerciseForm } from '@/features/exercises';
import styles from './ExercisesPage.module.css';

export function ExercisesPage() {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Exercise Library</h1>
                <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                    + Create Exercise
                </Button>
            </div>

            <ExerciseList groupByMuscle />

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
