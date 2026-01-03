/**
 * Progress Chart Component
 * 
 * Pure SVG line chart showing best set weight over time.
 * No external dependencies - uses React and SVG only.
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import styles from './ProgressChart.module.css';

interface DataPoint {
    date: Date;
    value: number;
    label: string;
}

interface ProgressChartProps {
    data: DataPoint[];
    unit: string;
    exerciseName: string;
}

export function ProgressChart({ data, unit, exerciseName }: ProgressChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Chart dimensions
    const width = 100; // percentage
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    const chartWidth = 100; // Will use viewBox for responsive scaling
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate scales
    const { points, yMin, yMax, yTicks } = useMemo(() => {
        if (data.length === 0) return { points: [], yMin: 0, yMax: 100, yTicks: [] };

        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Add 10% padding to y-axis
        const range = max - min || 10;
        const yMin = Math.floor((min - range * 0.1) / 5) * 5;
        const yMax = Math.ceil((max + range * 0.1) / 5) * 5;

        // Generate y-axis ticks (5 ticks)
        const yRange = yMax - yMin;
        const yStep = yRange / 4;
        const yTicks = Array.from({ length: 5 }, (_, i) => Math.round(yMin + i * yStep));

        // Map data to SVG coordinates
        const points = data.map((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * (400 - padding.left - padding.right);
            const yNorm = (d.value - yMin) / (yMax - yMin);
            const y = padding.top + chartHeight - yNorm * chartHeight;
            return { x, y, ...d };
        });

        return { points, yMin, yMax, yTicks };
    }, [data, chartHeight]);

    if (data.length < 2) {
        return <div className={styles.empty}>Not enough data to display chart</div>;
    }

    // Create line path
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Create area path (for gradient fill)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    return (
        <div className={styles.container}>
            <svg
                viewBox={`0 0 400 ${height}`}
                preserveAspectRatio="xMidYMid meet"
                className={styles.chart}
            >
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {yTicks.map(tick => {
                    const yNorm = (tick - yMin) / (yMax - yMin);
                    const y = padding.top + chartHeight - yNorm * chartHeight;
                    return (
                        <g key={tick}>
                            <line
                                x1={padding.left}
                                x2={400 - padding.right}
                                y1={y}
                                y2={y}
                                stroke="var(--color-border)"
                                strokeDasharray="4,4"
                            />
                            <text
                                x={padding.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                className={styles.axisLabel}
                            >
                                {tick}
                            </text>
                        </g>
                    );
                })}

                {/* Y-axis unit label */}
                <text
                    x={12}
                    y={padding.top + chartHeight / 2}
                    textAnchor="middle"
                    transform={`rotate(-90, 12, ${padding.top + chartHeight / 2})`}
                    className={styles.axisLabel}
                >
                    {unit}
                </text>

                {/* Area fill */}
                <path d={areaPath} fill="url(#areaGradient)" />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {points.map((point, i) => (
                    <g key={i}>
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={hoveredIndex === i ? 6 : 4}
                            fill="var(--color-accent-primary)"
                            stroke="var(--color-bg-primary)"
                            strokeWidth="2"
                            className={styles.dataPoint}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    </g>
                ))}

                {/* X-axis labels (first, middle, last) */}
                {[0, Math.floor(points.length / 2), points.length - 1].map(i => {
                    const point = points[i];
                    if (!point) return null;
                    return (
                        <text
                            key={i}
                            x={point.x}
                            y={height - 10}
                            textAnchor="middle"
                            className={styles.axisLabel}
                        >
                            {format(point.date, 'MMM d')}
                        </text>
                    );
                })}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && points[hoveredIndex] && (
                <div
                    className={styles.tooltip}
                    style={{
                        left: `${(points[hoveredIndex].x / 400) * 100}%`,
                        top: `${(points[hoveredIndex].y / height) * 100}%`
                    }}
                >
                    <div className={styles.tooltipDate}>
                        {format(points[hoveredIndex].date, 'MMM d, yyyy')}
                    </div>
                    <div className={styles.tooltipValue}>
                        {points[hoveredIndex].label}
                    </div>
                </div>
            )}
        </div>
    );
}
