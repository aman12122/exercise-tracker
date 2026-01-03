import { useState, useEffect } from 'react';
import type { MuscleGroup, Equipment, CreateExerciseDTO } from '@/domain';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '@/domain';
import { useCreateExercise, useDuplicateCheck } from '@/hooks';
import { Button, Input } from '@/components/common';
import styles from './CreateExerciseForm.module.css';

interface CreateExerciseFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const MUSCLE_GROUPS = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][];
const EQUIPMENT_OPTIONS = Object.entries(EQUIPMENT_LABELS) as [Equipment, string][];

export function CreateExerciseForm({ onSuccess, onCancel }: CreateExerciseFormProps) {
    const [name, setName] = useState('');
    const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
    const [equipment, setEquipment] = useState<Equipment | ''>('');
    const [notes, setNotes] = useState('');
    const [debouncedName, setDebouncedName] = useState('');

    const createExercise = useCreateExercise();
    const duplicateCheck = useDuplicateCheck();

    // Debounce name input for duplicate checking
    useEffect(() => {
        const timer = setTimeout(() => {
            if (name.length >= 3) {
                setDebouncedName(name);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [name]);

    // Check for duplicates when debounced name changes
    useEffect(() => {
        if (debouncedName) {
            duplicateCheck.mutate(debouncedName);
        }
    }, [debouncedName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || duplicateCheck.data?.exactMatch) {
            return;
        }

        const dto: CreateExerciseDTO = {
            name: name.trim(),
            muscleGroup,
            equipment: equipment || undefined,
            notes: notes.trim() || undefined,
        };

        try {
            await createExercise.mutateAsync(dto);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create exercise:', error);
        }
    };

    const hasExactMatch = duplicateCheck.data?.exactMatch;
    const hasSimilarMatches = duplicateCheck.data?.similarMatches?.length ?? 0 > 0;

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
                <Input
                    label="Exercise Name"
                    isRequired
                    placeholder="e.g., Incline Dumbbell Press"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={hasExactMatch ? 'An exercise with this name already exists' : undefined}
                />

                {hasSimilarMatches && !hasExactMatch && (
                    <div className={styles.duplicateWarning}>
                        <div className={styles.duplicateWarning__title}>
                            ⚠️ Similar exercises found
                        </div>
                        <div className={styles.duplicateWarning__list}>
                            {duplicateCheck.data?.similarMatches.slice(0, 3).map((ex) => (
                                <div key={ex.id} className={styles.duplicateWarning__item}>
                                    • {ex.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.row}>
                <div>
                    <label className={`${styles.label} ${styles['label--required']}`}>
                        Muscle Group
                    </label>
                    <select
                        className={styles.select}
                        value={muscleGroup}
                        onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                    >
                        {MUSCLE_GROUPS.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={styles.label}>Equipment</label>
                    <select
                        className={styles.select}
                        value={equipment}
                        onChange={(e) => setEquipment(e.target.value as Equipment | '')}
                    >
                        <option value="">None / Not specified</option>
                        {EQUIPMENT_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className={styles.label}>Notes</label>
                <textarea
                    className={styles.textarea}
                    placeholder="Optional notes about form or execution..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <div className={styles.actions}>
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={createExercise.isPending}
                    disabled={!name.trim() || !!hasExactMatch}
                >
                    Create Exercise
                </Button>
            </div>
        </form>
    );
}
