import { useState } from 'react';
import type { Exercise } from '@/domain';
import { Modal, Button } from '@/components/common';
import { ExerciseList } from '../ExerciseList';
import { CreateExerciseForm } from '../CreateExerciseForm';
import styles from './ExerciseSelector.module.css';

interface ExerciseSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (exercise: Exercise) => void;
    selectedIds?: string[];
    title?: string;
}

export function ExerciseSelector({
    isOpen,
    onClose,
    onSelect,
    selectedIds = [],
    title = 'Add Exercise',
}: ExerciseSelectorProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);

    const handleSelect = (exercise: Exercise) => {
        onSelect(exercise);
        // Don't auto-close, let user add multiple exercises
    };

    const handleCreateSuccess = () => {
        setShowCreateForm(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={showCreateForm ? 'Create Custom Exercise' : title}
            size="lg"
            footer={
                !showCreateForm ? (
                    <div className={styles.footer}>
                        <Button variant="secondary" onClick={() => setShowCreateForm(true)}>
                            + Create Custom
                        </Button>
                        <Button variant="primary" onClick={onClose}>
                            Done
                        </Button>
                    </div>
                ) : undefined
            }
        >
            {showCreateForm ? (
                <CreateExerciseForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setShowCreateForm(false)}
                />
            ) : (
                <ExerciseList
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    showAddButton
                    groupByMuscle
                />
            )}
        </Modal>
    );
}
