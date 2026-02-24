
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const DEFAULT_ALLOWED_EMAILS = [
    'fbmontechiari@gmail.com',
    'diegoalmeidacamposc@gmail.com'
];

const FALLBACK_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBW88UxQFO0yB4D-6KENSmpiAYkajZre-g',
    authDomain: 'prompt-metal.firebaseapp.com',
    projectId: 'prompt-metal',
    storageBucket: 'prompt-metal.firebasestorage.app',
    messagingSenderId: '307567224548',
    appId: '1:307567224548:web:92b65cfb9bd4e82071eef1',
};

const firebaseConfig = FALLBACK_FIREBASE_CONFIG;

const hasValidConfig = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const firebaseApp = hasValidConfig ? initializeApp(firebaseConfig) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;

export const isFirebaseAuthConfigured = () => hasValidConfig;

export const getAllowedEmails = () => {
    const envValue = String(import.meta.env.VITE_ALLOWED_EMAILS || '').trim();
    if (!envValue) return DEFAULT_ALLOWED_EMAILS;

    const parsed = envValue
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_EMAILS;
};

export const isEmailAllowed = (email: string) => {
    const normalized = String(email || '').trim().toLowerCase();
    return getAllowedEmails().includes(normalized);
};
