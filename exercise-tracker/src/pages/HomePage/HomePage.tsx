import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    useActiveSession,
    useSessionByDate,
    useCreateSession,
} from '@/hooks';
import { Button } from '@/components/common';
import styles from './HomePage.module.css';

export function HomePage() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd')
    );

    const { data: activeSession, isLoading: loadingActive } = useActiveSession();
    const { data: dateSession } = useSessionByDate(new Date(selectedDate));
    const createSession = useCreateSession();

    const handleStartWorkout = async () => {
        // If there's already a session for today, navigate to it
        if (dateSession) {
            navigate(`/workout/${dateSession.id}`);
            return;
        }

        // Otherwise create a new session
        const session = await createSession.mutateAsync({
            sessionDate: new Date(selectedDate),
        });
        navigate(`/workout/${session.id}`);
    };

    const handleContinueWorkout = () => {
        if (activeSession) {
            navigate(`/workout/${activeSession.id}`);
        }
    };

    if (loadingActive) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner} />
                    <div className={styles.loadingText}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.heroIcon}>🏋️</div>
                <h1 className={styles.heroTitle}>Ready to Train?</h1>
                <p className={styles.heroSubtitle}>
                    Track your workouts, log your sets, and crush your goals.
                </p>
            </div>

            {/* Active Session Alert */}
            {activeSession && (
                <div className={styles.activeSession}>
                    <div className={styles.activeSessionTitle}>
                        <span className={styles.pulse} />
                        Workout in Progress
                    </div>
                    <Button variant="success" onClick={handleContinueWorkout}>
                        Continue Workout
                    </Button>
                </div>
            )}

            {/* New Workout Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Start a Workout</h2>
                <div className={styles.datePicker}>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={format(new Date(), 'yyyy-MM-dd')}
                    />
                    <Button
                        variant="primary"
                        onClick={handleStartWorkout}
                        isLoading={createSession.isPending}
                    >
                        {dateSession ? 'Continue Session' : 'Start Workout'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
