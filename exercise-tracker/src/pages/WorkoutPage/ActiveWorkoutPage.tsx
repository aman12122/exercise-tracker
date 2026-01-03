
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionService } from '@/services';
import { useAuthStore } from '@/store';

export function ActiveWorkoutPage() {
    const navigate = useNavigate();
    const userId = useAuthStore(state => state.user?.id);

    useEffect(() => {
        if (!userId) return;

        const checkActive = async () => {
            try {
                const session = await getSessionService().getActiveSession(userId);
                if (session) {
                    navigate(`/workout/${session.id}`, { replace: true });
                } else {
                    navigate('/begin-workout', { replace: true });
                }
            } catch (e) {
                console.error("Failed to check active session", e);
                navigate('/dashboard');
            }
        };
        checkActive();
    }, [userId, navigate]);

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            Checking for active workout...
        </div>
    );
}
