import type { MuscleGroup } from '@/domain';
import type { CSSProperties } from 'react';

interface MuscleGroupIconProps {
    muscle: MuscleGroup;
    size?: number;
    className?: string;
    style?: CSSProperties;
}

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
    chest: '#ef4444',
    back: '#3b82f6',
    shoulders: '#f59e0b',
    biceps: '#22c55e',
    triceps: '#8b5cf6',
    forearms: '#14b8a6',
    quadriceps: '#ec4899',
    hamstrings: '#ec4899',
    glutes: '#ec4899',
    calves: '#ec4899',
    core: '#14b8a6',
    full_body: '#6366f1',
};

// SVG paths for each muscle group icon
const MUSCLE_PATHS: Record<MuscleGroup, { path: string; viewBox?: string }> = {
    chest: {
        // Pectoral muscle icon
        path: 'M12 4C8 4 5 7 5 11c0 3 2 5 4 6l2 1h2l2-1c2-1 4-3 4-6 0-4-3-7-7-7zm-3 8c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2zm6 0c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z',
    },
    back: {
        // Back/lats icon
        path: 'M12 2C9 2 7 4 6 7v10l2 3h8l2-3V7c-1-3-3-5-6-5zm-2 6h4v2h-4V8zm-1 4h6v2H9v-2z',
    },
    shoulders: {
        // Deltoid icon
        path: 'M5 10c0-3 3-6 7-6s7 3 7 6c0 2-1 4-3 5h-8c-2-1-3-3-3-5zm3-1a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z',
    },
    biceps: {
        // Flexed arm icon
        path: 'M4 16l2-8c1-3 3-5 6-5s5 2 6 5l2 8H4zm4-6c0 1.5 1.5 3 4 3s4-1.5 4-3c0-2-1.5-4-4-4s-4 2-4 4z',
    },
    triceps: {
        // Arm back icon  
        path: 'M8 4h8l2 6v8l-2 2H8l-2-2v-8l2-6zm2 4v4h4V8h-4zm0 6v2h4v-2h-4z',
    },
    forearms: {
        // Forearm icon
        path: 'M7 4l3 4v12h4V8l3-4H7zm3 8h4v2h-4v-2z',
    },
    quadriceps: {
        // Front leg icon
        path: 'M9 3h6l2 7-1 10H8l-1-10 2-7zm1 5h4v3h-4V8zm0 5h4v3h-4v-3z',
    },
    hamstrings: {
        // Back leg icon
        path: 'M9 3h6l1 9-2 8H10l-2-8 1-9zm1 5h4v2h-4V8zm0 4h4v3h-4v-3z',
    },
    glutes: {
        // Glutes icon
        path: 'M6 8c0-2 3-4 6-4s6 2 6 4v6c0 3-2 6-6 6s-6-3-6-6V8zm2 2a3 3 0 106 0 3 3 0 00-6 0zm6 0a3 3 0 106 0 3 3 0 00-6 0z',
    },
    calves: {
        // Calf icon
        path: 'M9 2h6l1 6-1 8-2 4h-2l-2-4-1-8 1-6zm1 4h4v3h-4V6zm0 5h4v4h-4v-4z',
    },
    core: {
        // Abs icon
        path: 'M8 4h8l1 16H7L8 4zm2 2v3h4V6h-4zm0 5v3h4v-3h-4zm0 5v2h4v-2h-4z',
    },
    full_body: {
        // Full body icon (person exercising)
        path: 'M12 2a3 3 0 100 6 3 3 0 000-6zM9 9h6l2 4-3 2v5h-1v-5h-2v5H10v-5l-3-2 2-4z',
    },
};

export function MuscleGroupIcon({
    muscle,
    size = 24,
    className = '',
    style = {},
}: MuscleGroupIconProps) {
    const { path, viewBox = '0 0 24 24' } = MUSCLE_PATHS[muscle];
    const color = MUSCLE_COLORS[muscle];

    return (
        <svg
            width={size}
            height={size}
            viewBox={viewBox}
            fill={color}
            className={className}
            style={style}
            aria-label={`${muscle} muscle group`}
        >
            <path d={path} />
        </svg>
    );
}

export { MUSCLE_COLORS };
