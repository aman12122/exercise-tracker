import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { Button, Input } from '@/components/common';
import {
    validateUsername,
    checkUsernameAvailability,
    reserveUsername,
    uploadAvatar,
    updateUserProfile
} from '@/services/userService';
import styles from './OnboardingPage.module.css';

export const OnboardingPage: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const updateUserProfileStore = useAuthStore((state) => state.updateUserProfile);
    const setNeedsOnboarding = useAuthStore((state) => state.setNeedsOnboarding);

    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced username availability check
    const checkAvailability = useCallback(async (value: string) => {
        const validation = validateUsername(value);
        if (!validation.valid) {
            setUsernameError(validation.error || null);
            setUsernameAvailable(null);
            return;
        }

        setIsCheckingUsername(true);
        setUsernameError(null);

        try {
            const available = await checkUsernameAvailability(value);
            setUsernameAvailable(available);
            if (!available) {
                setUsernameError('This username is already taken');
            }
        } catch {
            setUsernameError('Failed to check availability');
        } finally {
            setIsCheckingUsername(false);
        }
    }, []);

    // Handle username input change with debounce
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsername(value);
        setUsernameAvailable(null);
        setUsernameError(null);

        // Clear previous timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Validate and check availability after a delay
        if (value.trim()) {
            debounceTimeoutRef.current = setTimeout(() => {
                checkAvailability(value);
            }, 500);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // Handle avatar file selection
    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setAvatarError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setAvatarError('Image must be less than 5MB');
            return;
        }

        setAvatarError(null);
        setAvatarFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation
        const validation = validateUsername(username);
        if (!validation.valid) {
            setUsernameError(validation.error || 'Invalid username');
            return;
        }

        if (!usernameAvailable && usernameAvailable !== null) {
            setUsernameError('Please choose an available username');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Step 1: Reserve username (via Cloud Function or client-side transaction)
            const result = await reserveUsername(username, user.id, user.email);

            // Step 2: Upload avatar if selected
            let photoURL: string | null = null;
            if (avatarFile) {
                try {
                    photoURL = await uploadAvatar(user.id, avatarFile);
                    await updateUserProfile(user.id, { photoURL });
                } catch (avatarErr) {
                    console.error('Avatar upload failed:', avatarErr);
                    // Continue without avatar - user can add it later
                }
            }

            // Step 3: Update local state
            updateUserProfileStore({
                username: result.username,
                displayName: result.username,
                photoURL,
            });

            // Step 4: Mark onboarding as complete
            setNeedsOnboarding(false);

        } catch (error) {
            console.error('Onboarding failed:', error);
            if (error instanceof Error) {
                setSubmitError(error.message);
            } else {
                setSubmitError('Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitial = () => {
        if (username.trim()) {
            return username.trim()[0].toUpperCase();
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return 'U';
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <span className={styles.emoji}>👋</span>
                    <h1 className={styles.title}>Welcome to FitTrack!</h1>
                    <p className={styles.subtitle}>
                        Let's set up your profile to get started
                    </p>
                </div>

                {submitError && (
                    <div className={styles.error}>{submitError}</div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Avatar Upload */}
                    <div className={styles.avatarSection}>
                        <label className={styles.label}>Profile Photo (Optional)</label>
                        <div className={styles.avatarUpload}>
                            <div
                                className={styles.avatarPreview}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar preview"
                                        className={styles.avatarImage}
                                    />
                                ) : (
                                    <span className={styles.avatarInitial}>{getInitial()}</span>
                                )}
                                <div className={styles.avatarOverlay}>
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarSelect}
                                className={styles.fileInput}
                            />
                            {avatarPreview && (
                                <button
                                    type="button"
                                    className={styles.removeAvatar}
                                    onClick={handleRemoveAvatar}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        {avatarError && (
                            <span className={styles.errorText}>{avatarError}</span>
                        )}
                        <span className={styles.helperText}>
                            Click to upload (Max 5MB, images only)
                        </span>
                    </div>

                    {/* Username Input */}
                    <div className={styles.usernameSection}>
                        <Input
                            label="Choose a Username"
                            value={username}
                            onChange={handleUsernameChange}
                            placeholder="e.g., fitness_pro"
                            error={usernameError || undefined}
                            isRequired
                        />
                        <div className={styles.usernameStatus}>
                            {isCheckingUsername && (
                                <span className={styles.checking}>
                                    <span className={styles.spinner} />
                                    Checking availability...
                                </span>
                            )}
                            {!isCheckingUsername && usernameAvailable && !usernameError && (
                                <span className={styles.available}>
                                    ✓ Username is available
                                </span>
                            )}
                        </div>
                        <span className={styles.helperText}>
                            3-30 characters. Letters, numbers, dots, underscores, and hyphens only.
                        </span>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        isFullWidth
                        isLoading={isSubmitting}
                        disabled={!username.trim() || !!usernameError || isCheckingUsername}
                    >
                        Complete Setup
                    </Button>
                </form>

                <p className={styles.note}>
                    You can always change these later in your profile settings.
                </p>
            </div>
        </div>
    );
};
