
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { updateUserProfile, type UserPreferences } from '@/services/userService';
import styles from './PreferencesPage.module.css';

export function PreferencesPage() {
    const user = useAuthStore((state) => state.user);
    const updateLocalUser = useAuthStore((state) => state.updateUserProfile);

    const [isLoading, setIsLoading] = useState(false);
    const [preferences, setPreferences] = useState<UserPreferences>({
        weightUnit: 'lb',
        theme: 'system',
    });

    // Initialize state from user profile
    useEffect(() => {
        if (user?.preferences) {
            setPreferences({
                weightUnit: user.preferences.weightUnit || 'lb',
                theme: user.preferences.theme || 'system',
                distanceUnit: user.preferences.distanceUnit,
            });
        }
    }, [user?.preferences]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPreferences(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            await updateUserProfile(user.id, {
                preferences: preferences
            });

            // Update local store immediately for instant feel
            updateLocalUser({
                preferences: preferences
            });

            alert('Preferences saved successfully!');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            alert('Failed to save preferences. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Preferences</h1>
                <p className={styles.subtitle}>Customize your application experience.</p>
            </div>

            <div className={styles.card}>
                <div className={styles.sectionTitle}>Appearance</div>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Theme</label>
                        <select
                            name="theme"
                            className={styles.select}
                            value={preferences.theme}
                            onChange={handleChange}
                        >
                            <option value="system">System Default</option>
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.sectionTitle}>Units & Measurements</div>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Weight Unit</label>
                        <select
                            name="weightUnit"
                            className={styles.select}
                            value={preferences.weightUnit}
                            onChange={handleChange}
                        >
                            <option value="lb">Pounds (lb)</option>
                            <option value="kg">Kilograms (kg)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
