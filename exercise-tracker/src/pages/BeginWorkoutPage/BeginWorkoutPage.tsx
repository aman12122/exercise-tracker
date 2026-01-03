
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates, useSeedTemplates } from '@/hooks';
import { getSessionService } from '@/services';
import { Button } from '@/components/common';
import type { WorkoutTemplate } from '@/domain';
import styles from './BeginWorkoutPage.module.css';
import { useAuthStore } from '@/store';


// Small hardcoded list for Custom Workout
const DEMO_EXERCISES = [
    { id: 'bench_press', name: 'Bench Press' },
    { id: 'squat', name: 'Squat' },
    { id: 'deadlift', name: 'Deadlift' },
    { id: 'overhead_press', name: 'Overhead Press' },
    { id: 'pull_up', name: 'Pull Up' },
    { id: 'dumbbell_row', name: 'Dumbbell Row' },
    { id: 'lunges', name: 'Lunges' },
    { id: 'plank', name: 'Plank' },
    { id: 'push_up', name: 'Push Up' },
    { id: 'bicep_curl', name: 'Bicep Curl' },
    { id: 'tricep_extension', name: 'Tricep Extension' },
    { id: 'leg_press', name: 'Leg Press' }
];

export function BeginWorkoutPage() {
    const navigate = useNavigate();
    const { data: templates = [], isLoading: templatesLoading } = useTemplates();
    const { mutate: seedTemplates } = useSeedTemplates();
    const userId = useAuthStore(s => s.user?.id) || '';

    // Check if we need to seed
    if (!templatesLoading && templates.length === 0) {
        // Auto-seed or show button. User requirement: "If empty, seed (dev-only or button)"
        // I'll show a small button or just auto-seed via effect? 
        // Let's stick to the explicit "Load demo templates" logic if empty.
    }

    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customSelection, setCustomSelection] = useState<string[]>([]);
    const [isStarting, setIsStarting] = useState(false);

    const sessionService = getSessionService();

    const handleStart = async () => {
        setIsStarting(true);
        try {
            let session;
            let exerciseIds: string[] = [];

            if (isCustomMode) {
                // Custom Workout
                exerciseIds = customSelection;

                session = await sessionService.create(userId, {
                    sessionDate: new Date(),
                    name: "Custom Workout",
                    type: 'upper', // default or derive? 
                    initialExerciseIds: exerciseIds,
                    startImmediately: true
                });

            } else if (selectedTemplateId) {
                const template = templates.find(t => t.id === selectedTemplateId);
                if (!template) return;

                // Template Workout
                // Assuming template.exercises uses same IDs as system exercises
                exerciseIds = template.exercises.map(ex => ex.id);

                session = await sessionService.create(userId, {
                    sessionDate: new Date(),
                    name: template.name,
                    templateId: template.id,
                    type: template.type,
                    initialExerciseIds: exerciseIds,
                    startImmediately: true
                });
            }

            if (session) {
                // No need to startSession or loop add exercises anymore!
                navigate(`/workout/${session.id}`);
            }

        } catch (e) {
            console.error("Failed to start workout", e);
            alert("Failed to start workout. See console.");
        } finally {
            setIsStarting(false);
        }
    };

    // getUserIdFromAuth removed

    const toggleCustomExercise = (id: string) => {
        setCustomSelection(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    if (templatesLoading) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Begin Workout</h1>
                <p className={styles.subtitle}>Choose a template or build your own</p>
            </header>

            {!isCustomMode && (
                <>

                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <span>Your Workouts</span>
                            {templates.length === 0 && (
                                <Button size="sm" variant="ghost" onClick={() => seedTemplates()}>Load Demo Templates</Button>
                            )}
                        </div>
                        <div className={styles.grid}>
                            {templates.map(tmpl => (
                                <TemplateCard
                                    key={tmpl.id}
                                    template={tmpl}
                                    selected={selectedTemplateId === tmpl.id}
                                    onClick={() => setSelectedTemplateId(tmpl.id)}
                                />
                            ))}
                        </div>
                    </section>

                    <Button
                        className={styles.customButton}
                        onClick={() => {
                            setIsCustomMode(true);
                            setSelectedTemplateId(null);
                        }}
                    >
                        + Build Custom Workout
                    </Button>
                </>
            )}

            {isCustomMode && (
                <section className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <span>Custom Workout</span>
                        <Button variant="ghost" size="sm" onClick={() => setIsCustomMode(false)}>Close</Button>
                    </div>
                    <div className={styles.grid}>
                        {DEMO_EXERCISES.map(ex => (
                            <div
                                key={ex.id}
                                className={`${styles.card} ${customSelection.includes(ex.id) ? styles.cardSelected : ''}`}
                                onClick={() => toggleCustomExercise(ex.id)}
                            >
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardTitle}>{ex.name}</span>
                                    {customSelection.includes(ex.id) && <span>✓</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className={styles.footer}>
                <Button
                    variant="primary"
                    disabled={(!selectedTemplateId && !isCustomMode) || (isCustomMode && customSelection.length === 0) || isStarting}
                    onClick={handleStart}
                >
                    {isStarting ? 'Starting...' : 'Start Workout'}
                </Button>
            </div>
        </div>
    );
}

function TemplateCard({ template, selected, onClick }: { template: WorkoutTemplate, selected: boolean, onClick: () => void }) {
    return (
        <div className={`${styles.card} ${selected ? styles.cardSelected : ''}`} onClick={onClick}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{template.name}</span>
                <span className={`${styles.cardType} ${styles['type_' + template.type]}`}>{template.type}</span>
            </div>
            <div className={styles.exerciseList}>
                {template.exercises.slice(0, 3).map((ex, i) => (
                    <div key={i}>• {ex.name}</div>
                ))}
            </div>
            {template.exercises.length > 3 && (
                <div className={styles.moreExercises}>+ {template.exercises.length - 3} more</div>
            )}
        </div>
    );
}
