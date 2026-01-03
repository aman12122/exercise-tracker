import { type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { UserDropdown } from '../UserDropdown';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const user = useAuthStore((state) => state.user);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Link to="/dashboard" className={styles.logo}>
                        <span className={styles.logoIcon}>🏋️</span>
                        <span className={styles.logoGradient}>FitTrack</span>
                    </Link>

                    <nav className={styles.nav}>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles['navLink--active'] : ''}`
                            }
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/home"
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles['navLink--active'] : ''}`
                            }
                        >
                            Workouts
                        </NavLink>
                        <NavLink
                            to="/exercises"
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles['navLink--active'] : ''}`
                            }
                        >
                            Exercises
                        </NavLink>
                    </nav>

                    {mounted && user && (
                        <UserDropdown
                            username={user.username || user.displayName}
                            photoURL={user.photoURL}
                        />
                    )}
                </div>
            </header>

            <main className={styles.main}>{children}</main>

            <footer className={styles.footer}>
                Built with ❤️ for learning DevOps • Exercise Tracker v1.0
            </footer>
        </div>
    );
}
