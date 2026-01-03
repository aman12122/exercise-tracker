import React, { useState } from 'react';
import { firebaseSessionService } from '../../services/firebase/FirebaseSessionService';
import { useAuthStore } from '@/store';

const EXERCISE_IDS = [
    'bench_press',
    'squat',
    'deadlift',
    'overhead_press',
    'pull_up',
    'dumbbell_row',
    'lunges'
];

export const DataSeeder: React.FC = () => {
    const user = useAuthStore(state => state.user);
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const seedData = async () => {
        if (!user) {
            setStatus('User not logged in');
            return;
        }

        setLoading(true);
        setStatus('Starting seed...');

        try {
            const today = new Date();

            // Create 7 sessions for the last 7 days (including today)
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);

                setStatus(`Creating session for ${date.toISOString().split('T')[0]}...`);

                // 1. Create Session
                const session = await firebaseSessionService.create(user.id, {
                    sessionDate: date,
                    name: `Test Workout - ${date.toLocaleDateString()}`,
                    type: i % 2 === 0 ? 'upper' : 'lower' // Alternating types
                });

                // 2. Start Session
                await firebaseSessionService.startSession(session.id);

                // 3. Add Exercises (3 random ones)
                const shuffled = [...EXERCISE_IDS].sort(() => 0.5 - Math.random());
                const selectedExercises = shuffled.slice(0, 3);

                for (const exId of selectedExercises) {
                    // Ensure exercise exists (using fallback mechanism of service if not in DB)
                    // Note: If using real IDs, we'd query them. Here we rely on service to handle 'bench_press' etc.

                    // Add exercise
                    const sessionEx = await firebaseSessionService.addExercise(session.id, exId);

                    // 4. Add Sets (3 sets)
                    for (let s = 1; s <= 3; s++) {
                        await firebaseSessionService.addSet(session.id, sessionEx.id, {
                            reps: 8 + Math.floor(Math.random() * 5), // 8-12 reps
                            weight: 135 + Math.floor(Math.random() * 10) * 10, // 135, 145...
                            notes: 'Seeded data'
                        });
                    }
                }

                // 5. Complete Session
                await firebaseSessionService.completeSession(session.id);
            }

            setStatus('Seeding Complete! Refresh the page.');
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '20px',
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            marginTop: '20px',
            borderRadius: '8px'
        }}>
            <h3>Dev Tool: Data Seeder</h3>
            <p>Status: {status}</p>
            <button
                onClick={seedData}
                disabled={loading}
                style={{
                    padding: '8px 16px',
                    backgroundColor: loading ? '#666' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? 'Seeding...' : 'Seed 7 Days of Data'}
            </button>
        </div>
    );
};
