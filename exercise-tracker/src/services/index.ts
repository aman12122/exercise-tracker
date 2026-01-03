import config from '@/config';
import type { IExerciseService } from './interfaces/IExerciseService';
import type { ISessionService } from './interfaces/ISessionService';
import type { IWorkoutService } from './interfaces/IWorkoutService';
import type { IExerciseHistoryService } from './interfaces/IExerciseHistoryService';

// Mock Services
import { mockExerciseService } from './mock/MockExerciseService';
import { mockSessionService } from './mock/MockSessionService';

// Firebase Services
import { firebaseExerciseService } from './firebase/FirebaseExerciseService';
import { firebaseSessionService } from './firebase/FirebaseSessionService';
import { firebaseWorkoutService } from './firebase/FirebaseWorkoutService';
import { firebaseExerciseHistoryService } from './firebase/FirebaseExerciseHistoryService';

// Factory functions to get the appropriate service implementation
// based on configuration

export function getExerciseService(): IExerciseService {
    if (config.features.useFirebase) {
        return firebaseExerciseService;
    }
    return mockExerciseService;
}

export function getSessionService(): ISessionService {
    if (config.features.useFirebase) {
        return firebaseSessionService;
    }
    return mockSessionService;
}

export function getWorkoutService(): IWorkoutService {
    // Current requirement implies Firebase usage. 
    // If strict mock mode needed, would implement MockWorkoutService.
    return firebaseWorkoutService;
}

export function getExerciseHistoryService(): IExerciseHistoryService {
    // Currently only Firebase implementation exists
    return firebaseExerciseHistoryService;
}

export * from './interfaces/IExerciseService';
export * from './interfaces/ISessionService';
export * from './interfaces/IWorkoutService';
export * from './interfaces/IExerciseHistoryService';

