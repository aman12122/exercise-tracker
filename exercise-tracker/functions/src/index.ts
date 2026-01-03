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

// ----------------------------------------------------------------------------
// Dashboard Aggregation Trigger
// ----------------------------------------------------------------------------

import { onDocumentWritten } from "firebase-functions/v2/firestore";

/**
 * Updates the dashboard stats whenever a workout session is created, updated, or deleted.
 * 
 * Trigger: users/{userId}/workoutSessions/{sessionId}
 * 
 * Logic:
 * 1. Checks if the change is relevant (completed status change or content change of completed session).
 * 2. Recalculates all stats for the user:
 *    - Total Workouts, Volume
 *    - Streaks (Current, Longest)
 *    - Weekly/Monthly Volume
 *    - Recent Workouts
 *    - Top Exercises
 * 3. Writes result to: users/{userId}/stats/dashboard
 */
export const updateDashboardStats = onDocumentWritten(
    "users/{userId}/workoutSessions/{sessionId}",
    async (event) => {
        const userId = event.params.userId;

        // We always recalculate on any write to a session to be safe and simple.
        // Optimization: We could check if 'status' is 'completed' or was 'completed',
        // but for now, full recalculation ensures consistency.

        logger.info(`Recalculating dashboard stats for user: ${userId}`);

        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Fetch ALL completed sessions for this user
            // Note: In a massive scale app, this would need to be incremental.
            // For a personal tracker, fetching < 1000 docs is standard and fast on backend.
            const sessionsQuery = await db.collection("users").doc(userId).collection("workoutSessions")
                .where("status", "==", "completed")
                .orderBy("sessionDate", "desc")
                .get();

            let totalVolume = 0;
            let weeklyVolume = 0;
            let monthlyVolume = 0;
            const exerciseCounts = new Map<string, { name: string; count: number }>();
            const recentWorkouts: any[] = [];
            const workoutDates: Date[] = [];

            for (const doc of sessionsQuery.docs) {
                const data = doc.data();
                // Handle both Firestore Timestamp and Date objects
                const sessionDate = data.sessionDate?.toDate?.() || new Date(data.sessionDate);
                workoutDates.push(sessionDate);

                // Calculate volume
                let sessionVolume = 0;
                const exercises = data.exercises || [];
                for (const ex of exercises) {
                    const exId = ex.exerciseId;
                    const exName = ex.exercise?.name || 'Unknown';

                    if (!exerciseCounts.has(exId)) {
                        exerciseCounts.set(exId, { name: exName, count: 0 });
                    }
                    exerciseCounts.get(exId)!.count += 1;

                    const sets = ex.sets || [];
                    for (const set of sets) {
                        sessionVolume += (set.reps || 0) * (set.weight || 0);
                    }
                }

                totalVolume += sessionVolume;

                if (sessionDate >= sevenDaysAgo) {
                    weeklyVolume += sessionVolume;
                }
                if (sessionDate >= thirtyDaysAgo) {
                    monthlyVolume += sessionVolume;
                }

                // Recent workouts (max 5)
                if (recentWorkouts.length < 5) {
                    recentWorkouts.push({
                        date: sessionDate, // Firestore will convert this to Timestamp on save
                        name: data.name || 'Workout',
                        type: data.type,
                        sessionId: doc.id
                    });
                }
            }

            // Calculate streaks
            const { currentStreak, longestStreak } = calculateStreaks(workoutDates);

            // Top 5 exercises
            const topExercises = Array.from(exerciseCounts.entries())
                .map(([id, data]) => ({
                    exerciseId: id,
                    exerciseName: data.name,
                    count: data.count
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const dashboardStats = {
                totalWorkouts: sessionsQuery.size,
                totalVolume,
                currentStreak,
                longestStreak,
                weeklyVolume,
                monthlyVolume,
                recentWorkouts,
                topExercises,
                lastUpdated: FieldValue.serverTimestamp()
            };

            // Write to stats/dashboard
            await db.collection("users").doc(userId).collection("stats").doc("dashboard").set(dashboardStats);

            logger.info(`Stats updated successfully for user: ${userId}`);

        } catch (error) {
            logger.error("Error updating dashboard stats:", error);
        }
    }
);

// Helper: Calculate current and longest streaks
function calculateStreaks(dates: Date[]): { currentStreak: number; longestStreak: number } {
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Normalize to date strings and dedupe
    const uniqueDays = [...new Set(
        dates.map(d => d.toISOString().split('T')[0])
    )].sort().reverse(); // Most recent first

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Check if today or yesterday has a workout to start current streak
    const hasToday = uniqueDays[0] === today;
    const hasYesterday = uniqueDays[0] === yesterday || uniqueDays[1] === yesterday;

    for (const dateStr of uniqueDays) {
        const d = new Date(dateStr);

        if (lastDate === null) {
            tempStreak = 1;
        } else {
            const diff = (lastDate.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
            if (diff <= 1.5) { // Allow for timezone variations
                tempStreak += 1;
            } else {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 1;
            }
        }
        lastDate = d;
    }

    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Current streak is only valid if most recent workout was today or yesterday
    if (hasToday || hasYesterday) {
        currentStreak = tempStreak;
        // Recount from the most recent date
        let streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
            const curr = new Date(uniqueDays[i - 1]);
            const prev = new Date(uniqueDays[i]);
            const diff = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
            if (diff <= 1.5) {
                streak += 1;
            } else {
                break;
            }
        }
        currentStreak = streak;
    }

    return { currentStreak, longestStreak };
}
