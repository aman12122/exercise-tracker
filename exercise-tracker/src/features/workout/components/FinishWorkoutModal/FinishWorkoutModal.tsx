import { useState, useEffect } from 'react';
import type { MuscleGroup, WorkoutSession } from '@/domain';
import { MUSCLE_GROUP_LABELS } from '@/domain';
import { Button, Input, Modal } from '@/components/common';
import styles from './FinishWorkoutModal.module.css';

interface FinishWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, muscleGroups: MuscleGroup[]) => void;
    session: WorkoutSession;
    isSubmitting?: boolean;
}

const MUSCLE_GROUPS = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][];

export function FinishWorkoutModal({
    isOpen,
    onClose,
    onConfirm,
    session,
    isSubmitting = false
}: FinishWorkoutModalProps) {
    const [name, setName] = useState(session.name);
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>(
        session.muscleGroups || []
    );

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(session.name);
            setSelectedMuscleGroups(session.muscleGroups || []);
        }
    }, [isOpen, session]);

    const handleToggleMuscleGroup = (group: MuscleGroup) => {
        setSelectedMuscleGroups(prev => {
            if (prev.includes(group)) {
                return prev.filter(g => g !== group);
            } else {
                return [...prev, group];
            }
        });
    };

    const handleConfirm = () => {
        onConfirm(name, selectedMuscleGroups);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Finish Workout"
        >
            <div className={styles.modalContent}>
                <div className={styles.section}>
                    <Input
                        label="Workout Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Upper Body Power"
                        isRequired
                    />
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Muscle Groups / Tags</label>
                    <div className={styles.tagGrid}>
                        {MUSCLE_GROUPS.map(([value, label]) => (
                            <button
                                key={value}
                                className={`${styles.tagChip} ${selectedMuscleGroups.includes(value) ? styles.selected : ''
                                    }`}
                                onClick={() => handleToggleMuscleGroup(value)}
                                type="button"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        isLoading={isSubmitting}
                    >
                        Save & Finish
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
