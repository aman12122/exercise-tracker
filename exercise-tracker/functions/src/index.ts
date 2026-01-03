/**
 * Cloud Functions for Exercise Tracker
 * 
 * Includes:
 * - reserveUsername: Atomically reserves a unique username for a user
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Global options for cost control
setGlobalOptions({ maxInstances: 10 });

// Username validation regex: lowercase letters, numbers, underscores, dots, hyphens
// 3-30 characters
const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

interface ReserveUsernameRequest {
    username: string;
}

interface ReserveUsernameResponse {
    success: boolean;
    username: string;
    usernameLower: string;
}

/**
 * Atomically reserves a unique username for the authenticated user.
 * Uses a Firestore transaction to ensure no race conditions.
 * 
 * Creates/updates two documents:
 * - usernames/{usernameLower}: Maps username to user info
 * - users/{uid}: Stores user profile with username
 */
export const reserveUsername = onCall<ReserveUsernameRequest>(
    { cors: true },
    async (request): Promise<ReserveUsernameResponse> => {
        // Ensure user is authenticated
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "You must be logged in to reserve a username."
            );
        }

        const { username } = request.data;
        const uid = request.auth.uid;
        const email = request.auth.token.email || "";

        // Validate username format
        if (!username || typeof username !== "string") {
            throw new HttpsError(
                "invalid-argument",
                "Username is required."
            );
        }

        const trimmedUsername = username.trim();
        const usernameLower = trimmedUsername.toLowerCase();

        if (!USERNAME_REGEX.test(usernameLower)) {
            throw new HttpsError(
                "invalid-argument",
                "Username must be 3-30 characters and can only contain lowercase letters, numbers, dots, underscores, and hyphens."
            );
        }

        logger.info(`Attempting to reserve username: ${usernameLower} for user: ${uid}`);

        try {
            await db.runTransaction(async (transaction) => {
                const usernameDocRef = db.collection("usernames").doc(usernameLower);
                const userDocRef = db.collection("users").doc(uid);

                // Check if username is already taken
                const usernameDoc = await transaction.get(usernameDocRef);

                if (usernameDoc.exists) {
                    const existingUid = usernameDoc.data()?.uid;
                    // Allow if it's the same user updating their username
                    if (existingUid !== uid) {
                        throw new HttpsError(
                            "already-exists",
                            "This username is already taken. Please choose a different one."
                        );
                    }
                }

                // Check if user already has a different username
                const userDoc = await transaction.get(userDocRef);
                if (userDoc.exists) {
                    const existingUsername = userDoc.data()?.usernameLower;
                    if (existingUsername && existingUsername !== usernameLower) {
                        // Delete old username reservation
                        const oldUsernameRef = db.collection("usernames").doc(existingUsername);
                        transaction.delete(oldUsernameRef);
                    }
                }

                const now = FieldValue.serverTimestamp();

                // Create/update username reservation
                transaction.set(usernameDocRef, {
                    uid,
                    email,
                    createdAt: usernameDoc.exists ? usernameDoc.data()?.createdAt : now,
                });

                // Update user profile
                const userData = {
                    uid,
                    email,
                    username: trimmedUsername,
                    usernameLower,
                    updatedAt: now,
                    ...(userDoc.exists ? {} : { createdAt: now, photoURL: null }),
                };

                if (userDoc.exists) {
                    transaction.update(userDocRef, userData);
                } else {
                    transaction.set(userDocRef, userData);
                }
            });

            logger.info(`Successfully reserved username: ${usernameLower} for user: ${uid}`);

            return {
                success: true,
                username: trimmedUsername,
                usernameLower,
            };
        } catch (error) {
            if (error instanceof HttpsError) {
                throw error;
            }

            logger.error("Error reserving username:", error);
            throw new HttpsError(
                "internal",
                "An error occurred while reserving the username. Please try again."
            );
        }
    }
);

interface UpdateProfileRequest {
    photoURL?: string | null;
    username?: string;
}

interface UpdateProfileResponse {
    success: boolean;
}

/**
 * Updates the user's profile information (photoURL, etc.)
 */
export const updateUserProfile = onCall<UpdateProfileRequest>(
    { cors: true },
    async (request): Promise<UpdateProfileResponse> => {
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "You must be logged in to update your profile."
            );
        }

        const { photoURL } = request.data;
        const uid = request.auth.uid;

        try {
            const userDocRef = db.collection("users").doc(uid);

            const updateData: Record<string, unknown> = {
                updatedAt: FieldValue.serverTimestamp(),
            };

            if (photoURL !== undefined) {
                updateData.photoURL = photoURL;
            }

            await userDocRef.update(updateData);

            logger.info(`Updated profile for user: ${uid}`);

            return { success: true };
        } catch (error) {
            logger.error("Error updating profile:", error);
            throw new HttpsError(
                "internal",
                "An error occurred while updating your profile. Please try again."
            );
        }
    }
);
