
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

const firebaseConfig = {
    apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || FALLBACK_FIREBASE_CONFIG.apiKey),
    authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FALLBACK_FIREBASE_CONFIG.authDomain),
    projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || FALLBACK_FIREBASE_CONFIG.projectId),
    storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FALLBACK_FIREBASE_CONFIG.storageBucket),
    messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_FIREBASE_CONFIG.messagingSenderId),
    appId: String(import.meta.env.VITE_FIREBASE_APP_ID || FALLBACK_FIREBASE_CONFIG.appId),
};

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
