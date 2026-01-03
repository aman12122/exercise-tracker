import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { updateUserProfile, uploadAvatar } from '@/services/userService';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import styles from './ProfilePage.module.css';

interface ProfileFormData {
    firstName: string;
    lastName: string;
    organization: string;
    role: string;
    displayName: string;
    weightUnit: 'lb' | 'kg';
}

export function ProfilePage() {
    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUserProfile);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<ProfileFormData>({
        firstName: '',
        lastName: '',
        organization: '',
        role: '',
        displayName: '',
        weightUnit: 'lb',
    });
    const [imgError, setImgError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Phone Verification State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationId, setVerificationId] = useState<ConfirmationResult | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [phoneError, setPhoneError] = useState<string | null>(null);

    // Initialize form data when user loads
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: (user as any).firstName || '',
                lastName: (user as any).lastName || '',
                organization: (user as any).organization || '',
                role: (user as any).role || '',
                displayName: user.displayName || '',
                weightUnit: user.preferences?.weightUnit || 'lb',
            });
            setPhoneNumber((user as any).phoneNumber || '');
        }
    }, [user]);

    // Reset image error when photoURL changes
    useEffect(() => {
        setImgError(false);
    }, [user?.photoURL]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await updateUserProfile(user.id, {
                ...formData,
                displayName: formData.displayName, // Ensure core user prop is updated
                preferences: {
                    ...user.preferences,
                    weightUnit: formData.weightUnit,
                }
            });
            updateUser({
                ...formData,
                preferences: {
                    ...user.preferences,
                    weightUnit: formData.weightUnit,
                }
            } as any);
            // Optionally show toast success
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            setIsLoading(true);
            const photoURL = await uploadAvatar(user.id, file);
            await updateUserProfile(user.id, { photoURL });
            updateUser({ photoURL });
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            alert('Failed to upload image. Max size 5MB.');
        } finally {
            setIsLoading(false);
        }
    };

    const getInitial = () => {
        if (user?.username) return user.username[0].toUpperCase();
        if (user?.displayName) return user.displayName[0].toUpperCase();
        return 'U';
    };

    // Phone Verification Logic
    const setupRecaptcha = () => {
        if (!auth) {
            console.error('Auth not initialized');
            return;
        }
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                }
            });
        }
    };

    const handleSendCode = async () => {
        if (!phoneNumber) {
            setPhoneError('Please enter a phone number');
            return;
        }

        setPhoneError(null);
        setIsVerifying(true);
        setupRecaptcha();

        const appVerifier = window.recaptchaVerifier;

        try {
            if (!auth) throw new Error('Auth not initialized');
            // Using signInWithPhoneNumber to verify ownership
            // Note: In a real multi-factor setup, we might link this credential
            // For now, we just verify possession
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setVerificationId(confirmationResult);
            alert('Verification code sent to ' + phoneNumber);
        } catch (error) {
            console.error('Error sending SMS', error);
            console.error('Error sending SMS', error);
            const errorMessage = (error as any).message || 'Failed to send SMS';
            setPhoneError(`Error: ${errorMessage}. Check console for details.`);
            setIsVerifying(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationId) return;

        try {
            await verificationId.confirm(verificationCode);
            // Verification successful
            if (user) {
                await updateUserProfile(user.id, {
                    phoneNumber: phoneNumber,
                    phoneVerified: true
                });
                updateUser({
                    phoneNumber: phoneNumber,
                    phoneVerified: true
                } as any);
                setIsVerifying(false);
                setVerificationId(null);
                setVerificationCode('');
                alert('Phone number verified successfully!');
            }
        } catch (error) {
            console.error('Error verifying code', error);
            setPhoneError('Invalid verification code');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Profile Settings</h1>
                <p className={styles.subtitle}>Manage your account settings and preferences</p>
            </div>

            <div className={styles.card}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {user?.photoURL && !imgError ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || 'User'}
                                className={styles.avatarImage}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <span className={styles.avatarInitial}>{getInitial()}</span>
                        )}
                    </div>
                    <button
                        className={styles.uploadButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Change Avatar
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className={styles.fileInput}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>



                <div className={styles.sectionTitle}>Preferences</div>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Weight Unit</label>
                        <select
                            name="weightUnit"
                            className={styles.input}
                            value={formData.weightUnit}
                            onChange={handleChange}
                        >
                            <option value="lb">Pounds (lb)</option>
                            <option value="kg">Kilograms (kg)</option>
                        </select>
                    </div>
                </div>

                <div className={styles.sectionTitle}>Personal Information</div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={user?.email || ''}
                            disabled
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Username</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={user?.username || ''}
                            disabled
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Display Name</label>
                        <input
                            type="text"
                            name="displayName"
                            className={styles.input}
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder="How you appear to others"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Role</label>
                        <input
                            type="text"
                            name="role"
                            className={styles.input}
                            value={formData.role}
                            onChange={handleChange}
                            placeholder="e.g. Developer, Trainer"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            className={styles.input}
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            className={styles.input}
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label className={styles.label}>Organization</label>
                        <input
                            type="text"
                            name="organization"
                            className={styles.input}
                            value={formData.organization}
                            onChange={handleChange}
                            placeholder="Company or Organization Name"
                        />
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

            <div className={styles.card}>
                <div className={styles.sectionTitle}>Security & 2-Step Verification</div>

                <div className={styles.phoneGroup}>
                    <label className={styles.label}>Phone Number (for 2FA)</label>
                    <div className={styles.phoneInputWrapper}>
                        <input
                            type="tel"
                            className={styles.input}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1 555-555-5555"
                            disabled={isVerifying || ((user as any)?.phoneVerified)}
                        />
                        {!(user as any)?.phoneVerified && (
                            <button
                                className={styles.verifyButton}
                                onClick={handleSendCode}
                                disabled={isVerifying || !phoneNumber}
                            >
                                {isVerifying ? 'Sending...' : 'Verify'}
                            </button>
                        )}
                    </div>

                    {(user as any)?.phoneVerified && (
                        <div className={styles.verifiedBadge}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Verified
                        </div>
                    )}

                    {phoneError && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{phoneError}</p>}

                    <div id="recaptcha-container"></div>

                    {verificationId && (
                        <div className={styles.verificationForm}>
                            <label className={styles.label}>Enter Verification Code</label>
                            <div className={styles.codeInputs}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="123456"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                />
                                <button
                                    className={styles.saveButton}
                                    onClick={handleVerifyCode}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

// Add types for window object extended with recaptchaVerifier
declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
    }
}
