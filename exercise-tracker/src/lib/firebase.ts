import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import type { FirebasePerformance } from 'firebase/performance';
import { getRemoteConfig } from 'firebase/remote-config';
import type { RemoteConfig } from 'firebase/remote-config';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import config from '@/config';

// Only initialize Firebase if we're actually using it
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let performance: FirebasePerformance | null = null;
let remoteConfig: RemoteConfig | null = null;

if (config.features.useFirebase) {
    const firebaseConfig = config.firebase;

    // Validate that we have the required config
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error('Firebase is enabled but configuration is missing. Please set VITE_FIREBASE_* environment variables.');
    } else {
        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);

            // Initialize Analytics, Performance, and Remote Config
            if (typeof window !== 'undefined') {
                analytics = getAnalytics(app);
                performance = getPerformance(app);
                remoteConfig = getRemoteConfig(app);
            }

            // Connect to emulators in development
            if (import.meta.env.DEV && location.hostname === 'localhost') {
                console.log('[Firebase] Connecting to Emulators...');
                connectAuthEmulator(auth, 'http://localhost:9099');
                connectFirestoreEmulator(db, 'localhost', 8081);
            }

            // Storage is optional - only initialize if the bucket is configured
            try {
                storage = getStorage(app);
                if (import.meta.env.DEV && location.hostname === 'localhost') {
                    connectStorageEmulator(storage, 'localhost', 9199);
                }
                console.log('[Firebase] Storage initialized');
            } catch (storageError) {
                console.warn('[Firebase] Storage not available:', storageError);
                storage = null;
            }

            console.log('[Firebase] Initialized successfully');
        } catch (error) {
            console.error('[Firebase] Failed to initialize:', error);
        }
    }
} else {
    console.log('[Firebase] Mock mode - Firebase not initialized');
}

export { app, auth, db, storage, analytics, performance, remoteConfig };
