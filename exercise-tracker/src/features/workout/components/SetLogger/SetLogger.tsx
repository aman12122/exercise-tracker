import { useState, useRef, useEffect } from 'react';
import type { SetLog, CreateSetDTO, UpdateSetDTO } from '@/domain';
import { calculateExerciseVolume } from '@/domain';
import { useAuthStore } from '@/store';
import { useAddSet, useUpdateSet, useDeleteSet } from '@/hooks';
import { formatWeight, getDisplayWeight, getStorageWeight, type WeightUnit } from '@/lib/measurementUtils';
import styles from './SetLogger.module.css';

interface SetLoggerProps {
    sessionExerciseId: string;
    sessionId: string;
    sets: SetLog[];
    lastWeight?: number;
    lastReps?: number;
}

export function SetLogger({
    sessionExerciseId,
    sessionId,
    sets,
    lastWeight = 0,
    lastReps = 8,
}: SetLoggerProps) {
    const user = useAuthStore((state) => state.user);
    const weightUnit = user?.preferences?.weightUnit || 'lb';

    const addSet = useAddSet();
    const updateSet = useUpdateSet();
    const deleteSet = useDeleteSet();

    const handleAddSet = () => {
        const lastSet = sets[sets.length - 1];
        const dto: CreateSetDTO = {
            reps: lastSet?.reps ?? lastReps,
            weight: lastSet ? lastSet.weight : lastWeight, // Keep internal value (lbs)
        };
        addSet.mutate({ sessionExerciseId, dto, sessionId });
    };

    const handleUpdateSet = (setId: string, updates: UpdateSetDTO) => {
        updateSet.mutate({ setId, dto: updates, sessionId });
    };

    const handleDeleteSet = (setId: string) => {
        deleteSet.mutate({ setId, sessionId });
    };



    const volumeLbs = calculateExerciseVolume(sets);
    const volumeDisplay = getDisplayWeight(volumeLbs, weightUnit);

    return (
        <div className={styles.setLogger}>
            {sets.length === 0 ? (
                <div className={styles.emptyMessage}>
                    No sets logged yet. Add your first set!
                </div>
            ) : (
                sets.map((set) => (
                    <SetRow
                        key={set.id}
                        set={set}
                        unit={weightUnit}
                        onUpdate={(updates) => handleUpdateSet(set.id, updates)}
                        onDelete={() => handleDeleteSet(set.id)}
                    />
                ))
            )}

            <button
                className={styles.addSetButton}
                onClick={handleAddSet}
                disabled={addSet.isPending}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Set
            </button>

            {sets.length > 0 && (
                <div className={styles.volume}>
                    Total Volume:
                    <span className={styles.volumeValue}>
                        {formatWeight(volumeDisplay, weightUnit)}
                    </span>
                </div>
            )}
        </div>
    );
}

// Individual Set Row with inline editing
interface SetRowProps {
    set: SetLog;
    unit: WeightUnit;
    onUpdate: (updates: UpdateSetDTO) => void;
    onDelete: () => void;
}

function SetRow({ set, unit, onUpdate, onDelete }: SetRowProps) {
    const initialDisplayWeight = getDisplayWeight(set.weight, unit);

    const [reps, setReps] = useState(String(set.reps));
    const [weight, setWeight] = useState(String(initialDisplayWeight));
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync with prop changes
    useEffect(() => {
        setReps(String(set.reps));
        const newDisplayWeight = getDisplayWeight(set.weight, unit);
        // Only update if not currently editing (handled by not updating if focused? No, simpler for now)
        // We actually want to update if user changes preference or backend updates
        // To avoid cursor jumping we might need more complex logic, but for now:
        setWeight(String(Number(newDisplayWeight.toFixed(2)))); // Avoid long decimals
    }, [set.reps, set.weight, unit]);

    const handleUpdate = (field: 'reps' | 'weight', value: string) => {
        const numValue = parseFloat(value) || 0;

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce the update
        debounceRef.current = setTimeout(() => {
            if (field === 'weight') {
                // Convert back to storage unit (lbs)
                const storageWeight = getStorageWeight(numValue, unit);
                onUpdate({ weight: storageWeight });
            } else {
                onUpdate({ reps: numValue });
            }
        }, 500);
    };

    const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setReps(value);
        handleUpdate('reps', value);
    };

    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setWeight(value);
        handleUpdate('weight', value);
    };

    return (
        <div className={styles.setRow}>
            <span className={styles.setNumber}>{set.setNumber}</span>

            <div className={styles.inputGroup}>
                <input
                    type="number"
                    className={styles.input}
                    value={reps}
                    onChange={handleRepsChange}
                    min="0"
                    max="999"
                    aria-label={`Reps for set ${set.setNumber}`}
                />
                <span className={styles.inputLabel}>reps</span>
            </div>

            <div className={styles.inputGroup}>
                <input
                    type="number"
                    className={`${styles.input} ${styles['input--weight']}`}
                    value={weight}
                    onChange={handleWeightChange}
                    min="0"
                    max="9999"
                    step="2.5"
                    aria-label={`Weight for set ${set.setNumber}`}
                />
                <span className={styles.inputLabel}>{unit}</span>
            </div>

            <div className={styles.actions}>
                <button
                    className={`${styles.actionButton} ${styles['actionButton--delete']}`}
                    onClick={onDelete}
                    aria-label={`Delete set ${set.setNumber}`}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
