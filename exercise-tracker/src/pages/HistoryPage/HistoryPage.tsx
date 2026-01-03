import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { useSessions } from '@/hooks';
import { Modal } from '@/components/common';
import type { WorkoutSession } from '@/domain';
import styles from './HistoryPage.module.css';

const WORKOUT_BAR_CLASSES: Record<string, string> = {
    upper: styles.barUpper,
    lower: styles.barLower,
    push: styles.barPush,
    pull: styles.barPull,
    legs: styles.barLegs,
    cardio: styles.barCardio,
    other: styles.barOther
};

export function HistoryPage() {
    const navigate = useNavigate();
    const { data: sessions, isLoading } = useSessions();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDaySessions, setSelectedDaySessions] = useState<WorkoutSession[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const completedSessions = useMemo(() => {
        if (!sessions) return [];
        return sessions.filter(s => s.status === 'completed');
    }, [sessions]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const getSessionsForDay = (date: Date) => {
        return completedSessions.filter(s => isSameDay(new Date(s.completedAt!), date))
            .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
    };

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    const handleDayClick = (daySessions: WorkoutSession[]) => {
        if (daySessions.length === 1) {
            navigate(`/workout/${daySessions[0].id}`);
        } else if (daySessions.length > 1) {
            setSelectedDaySessions(daySessions);
            setIsModalOpen(true);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner} />
                    <div>Loading history...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Workout History</h1>
                <p className={styles.subtitle}>
                    You've completed <strong>{completedSessions.length}</strong> workouts. Keep it up!
                </p>
            </header>

            <div className={styles.calendarContainer}>
                <div className={styles.calendarControls}>
                    <button className={styles.navButton} onClick={handlePrevMonth}>←</button>
                    <span className={styles.calendarTitle}>
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button className={styles.navButton} onClick={handleNextMonth}>→</button>
                </div>

                <div className={styles.calendarGrid}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className={styles.weekDayHeader}>{day}</div>
                    ))}

                    {calendarDays.map(day => {
                        const daySessions = getSessionsForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isDayToday = isToday(day);

                        // Limit to 4 bars to ensure they fit, show +N if more
                        const visibleSessions = daySessions.slice(0, 4);
                        const remainingCount = daySessions.length - 4;

                        return (
                            <div
                                key={day.toISOString()}
                                className={`${styles.dayCell} ${!isCurrentMonth ? styles.otherMonth : ''} ${isDayToday ? styles.today : ''}`}
                                onClick={() => daySessions.length > 0 && handleDayClick(daySessions)}
                            >
                                <span className={styles.dayNumber}>{format(day, 'd')}</span>
                                {visibleSessions.map((session, idx) => (
                                    <div
                                        key={session.id || idx}
                                        className={`${styles.eventBar} ${WORKOUT_BAR_CLASSES[session.type || 'other'] || styles.barOther}`}
                                        title={session.name}
                                    />
                                ))}
                                {remainingCount > 0 && (
                                    <div className={styles.moreEvents}>+{remainingCount}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Workouts Completed"
                size="sm"
            >
                <div className={styles.modalWorkoutList}>
                    {selectedDaySessions.map(session => (
                        <div
                            key={session.id}
                            className={styles.modalWorkoutItem}
                            onClick={() => {
                                setIsModalOpen(false);
                                navigate(`/workout/${session.id}`);
                            }}
                        >
                            <div className={`${styles.modalDot} ${WORKOUT_BAR_CLASSES[session.type || 'other'] || styles.barOther}`} />
                            <div className={styles.modalInfo}>
                                <div className={styles.modalName}>
                                    {session.name || `${(session.type || 'Other').charAt(0).toUpperCase() + (session.type || 'other').slice(1)} Workout`}
                                </div>
                                <div className={styles.modalTime}>
                                    {format(new Date(session.completedAt!), 'h:mm a')}
                                </div>
                            </div>
                            <div className={styles.modalArrow}>→</div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
