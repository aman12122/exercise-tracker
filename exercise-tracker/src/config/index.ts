// Environment configuration
// This file uses environment variables that can be set per-environment

interface AppConfig {
    // Firebase configuration (for future use)
    firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
    };

    // Feature flags
    features: {
        useFirebase: boolean; // Toggle between mock and Firebase
        debugMode: boolean;
    };

    // API settings
    api: {
        mockLatencyMs: number; // Simulated latency for mock services
    };
}

// Parse environment variables with defaults
const config: AppConfig = {
    firebase: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
    },
    features: {
        useFirebase: import.meta.env.VITE_USE_FIREBASE === 'true',
        debugMode: import.meta.env.DEV,
    },
    api: {
        mockLatencyMs: parseInt(import.meta.env.VITE_MOCK_LATENCY_MS ?? '200', 10),
    },
};

export default config;
