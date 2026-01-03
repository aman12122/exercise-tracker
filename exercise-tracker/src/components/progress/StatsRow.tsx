/**
 * Stats Row Component
 * 
 * Displays key exercise statistics in a horizontal row of cards.
 */

import { format } from 'date-fns';
import { getDisplayWeight, formatWeight } from '@/lib/measurementUtils';
import type { WeightUnit } from '@/lib/measurementUtils';
import styles from './StatsRow.module.css';

interface StatsRowProps {
    prWeight: number;
    prReps: number;
    prDate: Date | null;
    totalVolume: number;
    totalSessions: number;
    lastPerformed: Date | null;
    weightUnit: WeightUnit;
}

export function StatsRow({
    prWeight,
    prReps,
    prDate,
    totalVolume,
    totalSessions,
    lastPerformed,
    weightUnit
}: StatsRowProps) {
    const displayPR = getDisplayWeight(prWeight, weightUnit);
    const displayVolume = getDisplayWeight(totalVolume, weightUnit);

    // Format volume for display (abbreviate large numbers)
    const formatVolume = (vol: number): string => {
        if (vol >= 1000000) {
            return `${(vol / 1000000).toFixed(1)}M`;
        }
        if (vol >= 1000) {
            return `${(vol / 1000).toFixed(1)}K`;
        }
        return vol.toFixed(0);
    };

    return (
        <div className={styles.container}>
            <div className={styles.stat}>
                <span className={styles.icon}>🏆</span>
                <div className={styles.content}>
                    <div className={styles.label}>Personal Record</div>
                    <div className={styles.value}>
                        {formatWeight(displayPR, weightUnit)} × {prReps}
                    </div>
                    {prDate && (
                        <div className={styles.subtext}>
                            {format(prDate, 'MMM d, yyyy')}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.stat}>
                <span className={styles.icon}>📊</span>
                <div className={styles.content}>
                    <div className={styles.label}>Total Volume</div>
                    <div className={styles.value}>
                        {formatVolume(displayVolume)} {weightUnit}
                    </div>
                </div>
            </div>

            <div className={styles.stat}>
                <span className={styles.icon}>🔥</span>
                <div className={styles.content}>
                    <div className={styles.label}>Sessions</div>
                    <div className={styles.value}>{totalSessions}</div>
                </div>
            </div>

            <div className={styles.stat}>
                <span className={styles.icon}>📅</span>
                <div className={styles.content}>
                    <div className={styles.label}>Last Performed</div>
                    <div className={styles.value}>
                        {lastPerformed ? format(lastPerformed, 'MMM d') : 'Never'}
                    </div>
                </div>
            </div>
        </div>
    );
}
