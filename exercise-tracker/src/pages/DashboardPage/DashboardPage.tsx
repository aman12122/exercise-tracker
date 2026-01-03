import { useState } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isToday,
    isSameMonth
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useMonthlyCompletions } from '@/hooks';
import { Button } from '@/components/common';
import { ExerciseProgressSection } from '@/components/progress';
import type { WorkoutType } from '@/domain';
import styles from './DashboardPage.module.css';

const WORKOUT_TYPE_CLASSES: Record<WorkoutType, string> = {
    upper: styles.workoutTypeUpper,
    lower: styles.workoutTypeLower,
    push: styles.workoutTypePush,
    pull: styles.workoutTypePull,
    legs: styles.workoutTypeLegs,
};

export function DashboardPage() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Week view: calculate start and end of the current week
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);

    const { data: completions = [] } = useMonthlyCompletions(currentDate);

    const days = eachDayOfInterval({
        start: weekStart,
        end: weekEnd,
    });

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

    const getCompletionForDay = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return completions.find(c => c.date === dateStr);
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Format the week range for the header
    const formatWeekRange = () => {
        const startMonth = format(weekStart, 'MMM d');
        const endMonth = format(weekEnd, 'MMM d, yyyy');
        // If week spans two months, show both
        if (!isSameMonth(weekStart, weekEnd)) {
            return `${startMonth} - ${endMonth}`;
        }
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    {formatWeekRange()}
                </h1>
                <div className={styles.controls}>
                    <Button variant="primary" size="sm" onClick={() => navigate('/begin-workout')}>
                        Begin Workout
                    </Button>
                    <Button variant="secondary" onClick={handlePrevWeek} size="sm">
                        ←
                    </Button>
                    <Button variant="secondary" onClick={handleNextWeek} size="sm">
                        →
                    </Button>
                </div>
            </header>

            <div className={styles.grid}>
                {weekDays.map(day => (
                    <div key={day} className={styles.dayHeader}>
                        {day}
                    </div>
                ))}

                {days.map(day => {
                    const completion = getCompletionForDay(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`${styles.day} ${isToday(day) ? styles.dayToday : ''}`}
                            onClick={() => {
                                if (completion) {
                                    navigate(`/workout/${completion.sessionId}`);
                                }
                            }}
                        >
                            <span className={styles.dayNumber}>
                                {format(day, 'd')}
                            </span>

                            {completion && (
                                <div
                                    className={`${styles.workoutLabel} ${WORKOUT_TYPE_CLASSES[completion.type] || ''
                                        }`}
                                    title={completion.name}
                                >
                                    {completion.type || 'Workout'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <ExerciseProgressSection />
        </div>
    );
}

