import { useParams } from 'react-router-dom';
import { WorkoutSessionView } from '@/features/workout';

export function WorkoutPage() {
    const { sessionId } = useParams<{ sessionId: string }>();

    if (!sessionId) {
        return <div>Session not found</div>;
    }

    return <WorkoutSessionView sessionId={sessionId} />;
}
