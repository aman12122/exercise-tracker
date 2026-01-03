import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import config from '@/config';
import { getUserProfile, subscribeToUserProfile, type UserProfile, type UserPreferences } from '@/services/userService';

interface User {
    id: string;
    email: string;
    displayName: string;
    username: string | null;
    photoURL: string | null;
    preferences: UserPreferences;
}

interface PersistedAuthData {
    user: User | null;
    expiresAt: number | null; // Timestamp when the session expires
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    needsOnboarding: boolean;
    error: string | null;
    rememberMe: boolean;
    expiresAt: number | null;

    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setRememberMe: (rememberMe: boolean) => void;
    setNeedsOnboarding: (needs: boolean) => void;
    updateUserProfile: (profile: Partial<User>) => void;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
}

// Mock user for development
const MOCK_USER: User = {
    id: 'mock-user-001',
    email: 'demo@exercisetracker.dev',
    displayName: 'Demo User',
    username: 'demouser',
    photoURL: null,
    preferences: { weightUnit: 'lb', theme: 'system' },
};

// 30 days in milliseconds
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000;

// Storage key
const AUTH_STORAGE_KEY = 'auth-storage';

// Check if stored session is expired
function isSessionExpired(expiresAt: number | null): boolean {
    if (!expiresAt) return true;
    return Date.now() > expiresAt;
}

// Custom storage that handles expiration
const customStorage = createJSONStorage<PersistedAuthData>(() => ({
    getItem: (name: string) => {
        const str = localStorage.getItem(name);
        if (!str) return null;

        try {
            const data = JSON.parse(str);
            // Check if session has expired
            if (data.state?.expiresAt && isSessionExpired(data.state.expiresAt)) {
                // Session expired, clear it
                localStorage.removeItem(name);
                return null;
            }
            return str;
        } catch {
            return null;
        }
    },
    setItem: (name: string, value: string) => {
        localStorage.setItem(name, value);
    },
    removeItem: (name: string) => {
        localStorage.removeItem(name);
    },
}));

// Store unsubscribe function for profile listener
let profileUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: config.features.useFirebase, // Only loading if Firebase needs to check auth
            isAuthenticated: false,
            needsOnboarding: false,
            error: null,
            rememberMe: false,
            expiresAt: null,

            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false,
                }),

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            setRememberMe: (rememberMe) => set({ rememberMe }),
            setNeedsOnboarding: (needsOnboarding) => set({ needsOnboarding }),

            updateUserProfile: (profile) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({
                        user: { ...currentUser, ...profile },
                    });
                }
            },

            // Mock login for development mode
            login: async (email: string, _password: string, rememberMe = false) => {
                if (config.features.useFirebase) {
                    // Firebase auth is handled elsewhere (AuthPage)
                    throw new Error('Use Firebase auth methods for login');
                }

                // Mock login - simulate async operation
                set({ isLoading: true, error: null });

                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));

                // Simple mock validation
                if (email && email.includes('@')) {
                    const expiresAt = rememberMe ? Date.now() + REMEMBER_ME_DURATION : null;
                    set({
                        user: {
                            ...MOCK_USER,
                            email: email,
                            displayName: email.split('@')[0],
                            username: email.split('@')[0].toLowerCase(),
                        },
                        isAuthenticated: true,
                        isLoading: false,
                        needsOnboarding: false,
                        rememberMe,
                        expiresAt,
                    });
                } else {
                    set({
                        error: 'Invalid email format',
                        isLoading: false,
                    });
                    throw new Error('Invalid email format');
                }
            },

            logout: async () => {
                // Unsubscribe from profile listener
                if (profileUnsubscribe) {
                    profileUnsubscribe();
                    profileUnsubscribe = null;
                }

                if (config.features.useFirebase && auth) {
                    try {
                        await signOut(auth);
                    } catch (error) {
                        console.error("Logout failed", error);
                    }
                }
                // Clear all auth state
                set({
                    user: null,
                    isAuthenticated: false,
                    needsOnboarding: false,
                    rememberMe: false,
                    expiresAt: null,
                });
                // Clear persisted storage
                localStorage.removeItem(AUTH_STORAGE_KEY);
            },
        }),
        {
            name: AUTH_STORAGE_KEY,
            storage: customStorage,
            partialize: (state) => ({
                // Only persist user and expiry if rememberMe is enabled
                user: state.rememberMe ? state.user : null,
                expiresAt: state.rememberMe ? state.expiresAt : null,
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<PersistedAuthData> | undefined;

                // If no persisted state or expired, start fresh
                if (!persisted?.user || isSessionExpired(persisted.expiresAt ?? null)) {
                    return {
                        ...currentState,
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    };
                }

                // Restore saved session
                return {
                    ...currentState,
                    user: persisted.user,
                    expiresAt: persisted.expiresAt ?? null,
                    isAuthenticated: true,
                    isLoading: false,
                    rememberMe: true,
                };
            },
        }
    )
);

// Initialize Auth Listener for Firebase mode
if (config.features.useFirebase && auth) {
    onAuthStateChanged(auth, async (firebaseUser) => {
        // Unsubscribe from previous profile listener
        if (profileUnsubscribe) {
            profileUnsubscribe();
            profileUnsubscribe = null;
        }

        if (firebaseUser) {
            const state = useAuthStore.getState();
            const expiresAt = state.rememberMe ? Date.now() + REMEMBER_ME_DURATION : null;

            // First, set basic user info from Firebase Auth
            useAuthStore.setState({
                user: {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || 'User',
                    username: null,
                    photoURL: firebaseUser.photoURL || null,
                    preferences: { weightUnit: 'lb', theme: 'system' },
                },
                isAuthenticated: true,
                isLoading: true, // Still loading until we check profile
                expiresAt,
            });

            // Check if user has completed onboarding (has username)
            try {
                const profile = await getUserProfile(firebaseUser.uid);

                if (profile && profile.username) {
                    // User has completed onboarding
                    useAuthStore.setState({
                        user: {
                            id: firebaseUser.uid,
                            email: profile.email,
                            displayName: profile.username,
                            username: profile.username,
                            photoURL: profile.photoURL,
                            preferences: profile.preferences,
                        },
                        needsOnboarding: false,
                        isLoading: false,
                    });

                    // Subscribe to profile changes
                    profileUnsubscribe = subscribeToUserProfile(firebaseUser.uid, (updatedProfile: UserProfile | null) => {
                        if (updatedProfile) {
                            useAuthStore.getState().updateUserProfile({
                                username: updatedProfile.username,
                                photoURL: updatedProfile.photoURL,
                                displayName: updatedProfile.username,
                                preferences: updatedProfile.preferences,
                            });
                        }
                    });
                } else {
                    // User needs to complete onboarding
                    useAuthStore.setState({
                        needsOnboarding: true,
                        isLoading: false,
                    });
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                // Assume new user needs onboarding
                useAuthStore.setState({
                    needsOnboarding: true,
                    isLoading: false,
                });
            }
        } else {
            useAuthStore.setState({
                user: null,
                isAuthenticated: false,
                needsOnboarding: false,
                isLoading: false,
            });
        }
    });
}

export function useCurrentUserId(): string {
    const user = useAuthStore((state) => state.user);
    if (!user) {
        throw new Error('User must be authenticated');
    }
    return user.id;
}
