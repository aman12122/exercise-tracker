import type { MuscleGroup } from '@/domain';
import type { CSSProperties } from 'react';

// Import SVG files as React components
import BicepsSvg from '@/assets/muscle-icons/biceps.svg?react';
import TricepsSvg from '@/assets/muscle-icons/triceps.svg?react';
import ForearmsSvg from '@/assets/muscle-icons/forearms.svg?react';
import QuadricepsSvg from '@/assets/muscle-icons/quadriceps.svg?react';
import HamstringsSvg from '@/assets/muscle-icons/hamstrings.svg?react';
import CalvesSvg from '@/assets/muscle-icons/calves.svg?react';
import ChestSvg from '@/assets/muscle-icons/chest.svg?react';
import BackSvg from '@/assets/muscle-icons/back.svg?react';
import ShouldersSvg from '@/assets/muscle-icons/shoulders.svg?react';
import CoreSvg from '@/assets/muscle-icons/core.svg?react';
import GlutesSvg from '@/assets/muscle-icons/glutes.svg?react';
import FullBodySvg from '@/assets/muscle-icons/full_body.svg?react';

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

// Map muscle groups to their SVG components
const MUSCLE_ICONS: Record<MuscleGroup, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    biceps: BicepsSvg,
    triceps: TricepsSvg,
    forearms: ForearmsSvg,
    quadriceps: QuadricepsSvg,
    hamstrings: HamstringsSvg,
    calves: CalvesSvg,
    chest: ChestSvg,
    back: BackSvg,
    shoulders: ShouldersSvg,
    core: CoreSvg,
    glutes: GlutesSvg,
    full_body: FullBodySvg,
};

export function MuscleGroupIcon({
    muscle,
    size = 24,
    className = '',
    style = {},
}: MuscleGroupIconProps) {
    const IconComponent = MUSCLE_ICONS[muscle];

    return (
        <IconComponent
            width={size}
            height={size}
            className={className}
            style={style}
            aria-label={`${muscle} muscle group`}
        />
    );
}

export { MUSCLE_COLORS };
