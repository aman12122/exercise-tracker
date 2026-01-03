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
import { Modal } from '@/components/common';
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
    const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<typeof completions | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Week calendar data
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const { data: completions = [] } = useMonthlyCompletions(currentDate);
    const { data: summary } = useDashboardSummary();

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

    const getCompletionsForDay = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return completions.filter(c => c.date === dateStr);
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
        const startYear = weekStart.getFullYear();
        const endYear = weekEnd.getFullYear();
        const startMonth = weekStart.getMonth();
        const endMonth = weekEnd.getMonth();

        // Different years - show full date for both
        if (startYear !== endYear) {
            return `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
        }

        // Same year but different months - show month for both, year only at end
        if (startMonth !== endMonth) {
            return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
        }

        // Same month and year - show month once, year at end
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
    };

    const displayName = user?.displayName || user?.username || 'Athlete';

    const handleDayClick = (dayCompletions: typeof completions) => {
        if (dayCompletions.length === 1) {
            navigate(`/workout/${dayCompletions[0].sessionId}`);
        } else if (dayCompletions.length > 1) {
            setSelectedDayWorkouts(dayCompletions);
            setIsModalOpen(true);
        }
    };

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
                            const dayCompletions = getCompletionsForDay(day);
                            const isTodayDate = isToday(day);
                            const hasWorkouts = dayCompletions.length > 0;
                            const isMultiple = dayCompletions.length > 1;

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`
                                        ${styles.dayCell}
                                        ${isTodayDate ? styles.dayCellToday : ''}
                                        ${hasWorkouts ? styles.dayCellHasWorkout : ''}
                                    `}
                                    onClick={() => {
                                        if (hasWorkouts) {
                                            handleDayClick(dayCompletions);
                                        }
                                    }}
                                >
                                    <span className={styles.dayNumber}>{format(day, 'd')}</span>

                                    {/* Multiple Workouts Indicator */}
                                    {isMultiple && (
                                        <div className={styles.multipleWorkoutsBadge}>
                                            {dayCompletions.length}
                                        </div>
                                    )}

                                    {/* Single Workout Type */}
                                    {!isMultiple && hasWorkouts && (
                                        <>
                                            <div className={styles.workoutIndicator}>
                                                <div className={`${styles.workoutTypeDot} ${WORKOUT_DOT_CLASSES[dayCompletions[0].type] || ''}`} />
                                            </div>
                                            <span className={styles.workoutTypeLabel}>{dayCompletions[0].type}</span>
                                        </>
                                    )}

                                    {/* Multiple Workout Types Dots */}
                                    {isMultiple && (
                                        <div className={styles.multiDotsContainer}>
                                            {dayCompletions.slice(0, 3).map((comp, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`${styles.miniDot} ${WORKOUT_DOT_CLASSES[comp.type] || ''}`}
                                                />
                                            ))}
                                            {dayCompletions.length > 3 && (
                                                <div className={styles.miniDotPlus}>+</div>
                                            )}
                                        </div>
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

            {/* Workout Selector Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Workouts Completed"
                size="sm"
            >
                <div className={styles.workoutList}>
                    {selectedDayWorkouts?.map((workout, index) => (
                        <div
                            key={index}
                            className={styles.workoutListItem}
                            onClick={() => {
                                setIsModalOpen(false);
                                navigate(`/workout/${workout.sessionId}`);
                            }}
                        >
                            <div className={`${styles.workoutListDot} ${WORKOUT_DOT_CLASSES[workout.type] || ''}`}></div>
                            <div className={styles.workoutListInfo}>
                                <div className={styles.workoutListName}>{workout.name || `${workout.type} Workout`}</div>
                                <div className={styles.workoutListTime}>
                                    {format(workout.completedAt, 'h:mm a')}
                                </div>
                            </div>
                            <div className={styles.workoutListArrow}>→</div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div >
    );
}
