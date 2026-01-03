import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import styles from './UserDropdown.module.css';

interface UserDropdownProps {
    username: string;
    photoURL: string | null;
}

export function UserDropdown({ username, photoURL }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [imgError, setImgError] = useState(false);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset error state when photoURL changes
    useEffect(() => {
        setImgError(false);
    }, [photoURL]);

    // Handle hover with delay for better UX
    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 150);
    };

    const handleSignOut = async () => {
        setIsOpen(false);
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    const handleDemoOptionA = () => {
        setIsOpen(false);
        navigate('/profile');
    };

    const handleDemoOptionB = () => {
        setIsOpen(false);
        navigate('/preferences');
    };

    // Get avatar initial from username
    const getInitial = () => {
        if (username && username.length > 0) {
            return username[0].toUpperCase();
        }
        return 'U';
    };

    return (
        <div
            ref={dropdownRef}
            className={styles.container}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <div className={styles.avatar}>
                    {photoURL && !imgError ? (
                        <img
                            src={photoURL}
                            alt={username}
                            className={styles.avatarImage}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className={styles.avatarInitial}>{getInitial()}</span>
                    )}
                </div>
                <span className={styles.username}>{username}</span>
                <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownAvatar}>
                            {photoURL && !imgError ? (
                                <img
                                    src={photoURL}
                                    alt={username}
                                    className={styles.avatarImage}
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className={styles.avatarInitial}>{getInitial()}</span>
                            )}
                        </div>
                        <div className={styles.dropdownInfo}>
                            <span className={styles.dropdownUsername}>{username}</span>
                            <span className={styles.dropdownLabel}>Personal Account</span>
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <ul className={styles.menu}>
                        <li>
                            <button
                                className={styles.menuItem}
                                onClick={handleDemoOptionA}
                            >
                                <svg
                                    className={styles.menuIcon}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                Profile Settings
                            </button>
                        </li>
                        <li>
                            <button
                                className={styles.menuItem}
                                onClick={handleDemoOptionB}
                            >
                                <svg
                                    className={styles.menuIcon}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                                Preferences
                            </button>
                        </li>
                    </ul>

                    <div className={styles.divider} />

                    <button
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                        onClick={handleSignOut}
                    >
                        <svg
                            className={styles.menuIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
