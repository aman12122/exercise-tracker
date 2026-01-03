/**
 * User Service (Free Spark Plan Compatible)
 * 
 * Handles user profile operations using client-side Firestore transactions:
 * - Username reservation with uniqueness enforcement
 * - Profile fetching from Firestore
 * - Avatar upload to Firebase Storage (if enabled)
 * - Username availability checking
 * 
 * Note: This implementation uses client-side transactions which work on the
 * free Spark plan without requiring Cloud Functions.
 */

import {
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    runTransaction,
    serverTimestamp,
    type Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export interface UserPreferences {
    weightUnit: 'lb' | 'kg';
    theme: 'light' | 'dark' | 'system';
    distanceUnit?: 'mi' | 'km';
    // ... other preferences
}


export interface UserProfile {
    uid: string;
    email: string;
    username: string;
    usernameLower: string;
    displayName?: string;
    photoURL: string | null;
    firstName?: string;
    lastName?: string;
    organization?: string;
    role?: string;
    phoneNumber?: string;
    phoneVerified?: boolean;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
}

interface ReserveUsernameResponse {
    success: boolean;
    username: string;
    usernameLower: string;
}

// Username validation regex: 3-30 chars, lowercase letters, numbers, dots, underscores, hyphens
const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

/**
 * Validates username format client-side
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
    const trimmed = username.trim();
    const lower = trimmed.toLowerCase();

    if (!trimmed) {
        return { valid: false, error: 'Username is required' };
    }

    if (trimmed.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (trimmed.length > 30) {
        return { valid: false, error: 'Username must be 30 characters or less' };
    }

    if (!USERNAME_REGEX.test(lower)) {
        return {
            valid: false,
            error: 'Username can only contain letters, numbers, dots, underscores, and hyphens'
        };
    }

    // Check for reserved usernames
    const reserved = ['admin', 'root', 'system', 'moderator', 'support', 'help'];
    if (reserved.includes(lower)) {
        return { valid: false, error: 'This username is reserved' };
    }

    return { valid: true };
}

/**
 * Check if a username is available (client-side check)
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
    if (!db) {
        console.error('Firestore not initialized');
        return false;
    }

    const usernameLower = username.trim().toLowerCase();
    const usernameDocRef = doc(db, 'usernames', usernameLower);

    try {
        const docSnap = await getDoc(usernameDocRef);
        return !docSnap.exists();
    } catch (error) {
        console.error('Error checking username availability:', error);
        return false;
    }
}

/**
 * Reserve a username using client-side Firestore transaction
 * This is atomic and prevents race conditions
 */
export async function reserveUsername(
    username: string,
    uid: string,
    email: string
): Promise<ReserveUsernameResponse> {
    if (!db) {
        throw new Error('Firestore not initialized');
    }

    // Store reference to avoid TypeScript narrowing issues in callback
    const firestore = db;

    const trimmedUsername = username.trim();
    const usernameLower = trimmedUsername.toLowerCase();

    // Validate username format
    const validation = validateUsername(trimmedUsername);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    try {
        await runTransaction(firestore, async (transaction) => {
            const usernameDocRef = doc(firestore, 'usernames', usernameLower);
            const userDocRef = doc(firestore, 'users', uid);

            // Check if username is already taken
            const usernameDoc = await transaction.get(usernameDocRef);

            if (usernameDoc.exists()) {
                const existingUid = usernameDoc.data()?.uid;
                if (existingUid !== uid) {
                    throw new Error('This username is already taken. Please choose a different one.');
                }
            }

            // Check if user already has a different username
            const userDoc = await transaction.get(userDocRef);
            if (userDoc.exists()) {
                const existingUsername = userDoc.data()?.usernameLower;
                if (existingUsername && existingUsername !== usernameLower) {
                    // Delete old username reservation
                    const oldUsernameRef = doc(firestore, 'usernames', existingUsername);
                    transaction.delete(oldUsernameRef);
                }
            }

            const now = serverTimestamp();

            // Create/update username reservation
            transaction.set(usernameDocRef, {
                uid,
                email,
                createdAt: usernameDoc.exists() ? usernameDoc.data()?.createdAt : now,
            });

            // Update user profile
            const userData = {
                uid,
                email,
                username: trimmedUsername,
                usernameLower,
                updatedAt: now,
                ...(userDoc.exists() ? {} : { createdAt: now, photoURL: null }),
            };

            if (userDoc.exists()) {
                transaction.update(userDocRef, userData);
            } else {
                transaction.set(userDocRef, userData);
            }
        });

        return {
            success: true,
            username: trimmedUsername,
            usernameLower,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to reserve username. Please try again.');
    }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db) {
        console.error('Firestore not initialized');
        return null;
    }

    try {
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();
        return {
            uid: data.uid,
            email: data.email,
            username: data.username,
            usernameLower: data.usernameLower,

            photoURL: data.photoURL || null,
            preferences: data.preferences || { weightUnit: 'lb' },
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

/**
 * Subscribe to user profile changes
 */
export function subscribeToUserProfile(
    uid: string,
    callback: (profile: UserProfile | null) => void
): Unsubscribe {
    if (!db) {
        console.error('Firestore not initialized');
        return () => { };
    }

    const userDocRef = doc(db, 'users', uid);

    return onSnapshot(userDocRef, (docSnap) => {
        if (!docSnap.exists()) {
            callback(null);
            return;
        }

        const data = docSnap.data();
        callback({
            uid: data.uid,
            email: data.email,
            username: data.username,
            usernameLower: data.usernameLower,

            photoURL: data.photoURL || null,
            preferences: data.preferences || { weightUnit: 'lb' },
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        });
    }, (error) => {
        console.error('Error subscribing to user profile:', error);
        callback(null);
    });
}

/**
 * Upload avatar image to Firebase Storage
 * Note: Requires Firebase Storage to be enabled in the console
 */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
    if (!storage) {
        throw new Error('Firebase Storage not enabled. Please enable it in the Firebase Console.');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error('Image must be less than 5MB');
    }

    // Generate unique filename
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `avatar_${Date.now()}.${extension}`;
    const avatarRef = ref(storage, `public/avatars/${uid}/${filename}`);

    try {
        // Upload file
        await uploadBytes(avatarRef, file, {
            contentType: file.type,
            customMetadata: {
                uploadedBy: uid,
            },
        });

        // Get download URL
        const downloadURL = await getDownloadURL(avatarRef);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        throw new Error('Failed to upload avatar. Please try again.');
    }
}

/**
 * Delete avatar from Firebase Storage
 */
export async function deleteAvatar(avatarURL: string): Promise<void> {
    if (!storage) {
        return; // Storage not enabled, nothing to delete
    }

    try {
        const avatarRef = ref(storage, avatarURL);
        await deleteObject(avatarRef);
    } catch (error) {
        console.error('Error deleting avatar:', error);
        // Don't throw - avatar might already be deleted
    }
}

/**
 * Helper to remove undefined values from objects (Firestore doesn't accept undefined)
 */
function removeUndefined(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
    } else if (obj !== null && typeof obj === 'object') {
        // Handle Date objects correctly - return them as is
        if (obj instanceof Date) return obj;

        return Object.fromEntries(
            Object.entries(obj)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, removeUndefined(v)])
        );
    }
    return obj;
}

/**
 * Update user profile photoURL directly in Firestore
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (!db) {
        throw new Error('Firestore not initialized');
    }

    try {
        const userDocRef = doc(db, 'users', uid);
        // Clean data before sending to Firestore
        const cleanData = removeUndefined(data);

        await updateDoc(userDocRef, {
            ...cleanData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile. Please try again.');
    }
}
