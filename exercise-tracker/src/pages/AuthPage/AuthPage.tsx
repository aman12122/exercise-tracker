import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store';
import { Button, Input } from '@/components/common';
import config from '@/config';
import styles from './AuthPage.module.css';

export const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const login = useAuthStore((state) => state.login);
    const setRememberMeStore = useAuthStore((state) => state.setRememberMe);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (config.features.useFirebase) {
                // Set rememberMe in store before Firebase auth
                setRememberMeStore(rememberMe);

                if (!auth) {
                    throw new Error('Firebase is not configured');
                }

                if (isLogin) {
                    await signInWithEmailAndPassword(auth, email, password);
                } else {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    if (displayName) {
                        await updateProfile(userCredential.user, {
                            displayName
                        });
                    }
                }
                // Auth listener in store will handle redirect/state update
            } else {
                // Mock mode - use the store's login function
                await login(email, password, rememberMe);
            }
        } catch (err: unknown) {
            console.error(err);
            let msg = 'Authentication failed';

            if (err && typeof err === 'object' && 'code' in err) {
                const firebaseErr = err as { code: string };
                if (firebaseErr.code === 'auth/invalid-credential') msg = 'Invalid email or password';
                else if (firebaseErr.code === 'auth/email-already-in-use') msg = 'Email already in use';
                else if (firebaseErr.code === 'auth/weak-password') msg = 'Password should be at least 6 characters';
            } else if (err instanceof Error) {
                msg = err.message;
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.authCard}>
                <div className={styles.logoContainer}>
                    <span className={styles.logoIcon}>🏋️</span>
                    <span className={styles.logoText}>FitTrack</span>
                </div>

                <h1 className={styles.title}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className={styles.subtitle}>
                    {isLogin
                        ? 'Sign in to continue your fitness journey'
                        : 'Start tracking your exercises today'}
                </p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {!isLogin && (
                        <Input
                            label="Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your Name"
                            required
                        />
                    )}

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {isLogin && (
                        <label className={styles.rememberMe}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span className={styles.checkboxLabel}>
                                Remember me for 30 days
                            </span>
                        </label>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        isFullWidth
                        isLoading={loading}
                    >
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </Button>
                </form>

                <div className={styles.toggle}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        type="button"
                        className={styles.link}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>

                {!config.features.useFirebase && (
                    <div className={styles.demoNote}>
                        <span className={styles.demoIcon}>💡</span>
                        <span>Demo mode: Enter any email to sign in</span>
                    </div>
                )}
            </div>
        </div>
    );
};

