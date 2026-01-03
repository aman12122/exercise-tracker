import { useState, useMemo } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isToday,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useMonthlyCompletions, useDashboardSummary } from '@/hooks';
import { useAuthStore } from '@/store';
import { ExerciseProgressSection } from '@/components/progress';
import type { WorkoutType } from '@/domain';
import styles from './DashboardPage.module.css';

const WORKOUT_DOT_CLASSES: Record<WorkoutType, string> = {
    upper: styles.workoutDotUpper,
    lower: styles.workoutDotLower,
    push: styles.workoutDotPush,
    pull: styles.workoutDotPull,
    legs: styles.workoutDotLegs,
};

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function getMotivationalMessage(weeklyWorkouts: number): string {
    if (weeklyWorkouts === 0) return "Ready to start your fitness journey?";
    if (weeklyWorkouts === 1) return "Great start! Keep the momentum going!";
    if (weeklyWorkouts < 4) return "You're building a solid routine!";
    return "Crushing it! 💪 Keep up the amazing work!";
}

export function DashboardPage() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Week calendar data
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const { data: completions = [] } = useMonthlyCompletions(currentDate);
    const { data: summary } = useDashboardSummary();

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

    const getCompletionForDay = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return completions.find(c => c.date === dateStr);
    };

    // Calculate stats
    const thisWeekWorkouts = useMemo(() => {
        const nowWeekStart = startOfWeek(new Date());
        const nowWeekEnd = endOfWeek(new Date());
        return completions.filter(c => {
            const date = new Date(c.date);
            return date >= nowWeekStart && date <= nowWeekEnd;
        }).length;
    }, [completions]);

    const currentStreak = useMemo(() => {
        return summary?.currentStreak || 0;
    }, [summary]);

    const formatWeekRange = () => {
        const startMonth = format(weekStart, 'MMM d');
        const endMonth = format(weekEnd, 'd, yyyy');
        return `${startMonth} - ${endMonth}`;
    };

    const displayName = user?.displayName || user?.username || 'Athlete';

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <p className={styles.greeting}>{getGreeting()}, {displayName} 👋</p>
                    <h1 className={styles.heroTitle}>
                        {getMotivationalMessage(thisWeekWorkouts)}
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Track your workouts, log your sets, and crush your fitness goals.
                    </p>
                    <div className={styles.heroCta}>
                        <button
                            className={styles.primaryButton}
                            onClick={() => navigate('/begin-workout')}
                        >
                            <span className={styles.primaryButtonIcon}>🏋️</span>
                            Start Workout
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.statsSection}>
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.statCardAccent1}`}>
                        <div className={styles.statIcon}>🔥</div>
                        <div className={styles.statValue}>{thisWeekWorkouts}</div>
                        <div className={styles.statLabel}>Workouts This Week</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statCardAccent2}`}>
                        <div className={styles.statIcon}>⚡</div>
                        <div className={styles.statValue}>{summary?.totalWorkouts || 0}</div>
                        <div className={styles.statLabel}>Total Sessions</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statCardAccent3}`}>
                        <div className={styles.statIcon}>🎯</div>
                        <div className={styles.statValue}>{summary?.topExercises?.length || 0}</div>
                        <div className={styles.statLabel}>Exercises Tracked</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statCardAccent4}`}>
                        <div className={styles.statIcon}>📈</div>
                        <div className={styles.statValue}>{currentStreak > 0 ? currentStreak : '—'}</div>
                        <div className={styles.statLabel}>Current Streak</div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {/* Week Calendar */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{formatWeekRange()}</h2>
                    <div className={styles.sectionControls}>
                        <button className={styles.navButton} onClick={handlePrevWeek}>←</button>
                        <button className={styles.todayButton} onClick={() => setCurrentDate(new Date())}>
                            Today
                        </button>
                        <button className={styles.navButton} onClick={handleNextWeek}>→</button>
                    </div>
                </div>

                <div className={styles.weekCalendar}>
                    <div className={styles.weekDaysRow}>
                        {weekDays.map(day => (
                            <div key={day} className={styles.weekDayLabel}>{day}</div>
                        ))}
                    </div>
                    <div className={styles.daysRow}>
                        {days.map(day => {
                            const completion = getCompletionForDay(day);
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`
                                        ${styles.dayCell}
                                        ${isTodayDate ? styles.dayCellToday : ''}
                                        ${completion ? styles.dayCellHasWorkout : ''}
                                    `}
                                    onClick={() => {
                                        if (completion) {
                                            navigate(`/workout/${completion.sessionId}`);
                                        }
                                    }}
                                >
                                    <span className={styles.dayNumber}>{format(day, 'd')}</span>
                                    {completion && (
                                        <>
                                            <div className={styles.workoutIndicator}>
                                                <div className={`${styles.workoutTypeDot} ${WORKOUT_DOT_CLASSES[completion.type] || ''}`} />
                                            </div>
                                            <span className={styles.workoutTypeLabel}>{completion.type}</span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                    <div
                        className={styles.actionCard}
                        onClick={() => navigate('/begin-workout')}
                    >
                        <div className={styles.actionIcon}>💪</div>
                        <div className={styles.actionText}>
                            <div className={styles.actionTitle}>New Workout</div>
                            <div className={styles.actionSubtitle}>Start a training session</div>
                        </div>
                        <span className={styles.actionArrow}>→</span>
                    </div>
                    <div
                        className={styles.actionCard}
                        onClick={() => navigate('/exercises')}
                    >
                        <div className={styles.actionIcon}>📋</div>
                        <div className={styles.actionText}>
                            <div className={styles.actionTitle}>Exercise Library</div>
                            <div className={styles.actionSubtitle}>Browse all exercises</div>
                        </div>
                        <span className={styles.actionArrow}>→</span>
                    </div>
                </div>

                {/* Progress Section */}
                <div className={styles.progressSection}>
                    <ExerciseProgressSection />
                </div>

            </main >
        </div >
    );
}
