import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCAyFLJztZB8UcUdh4yXf-h49IZAFBy5nI",
  authDomain: "prompt-metal.firebaseapp.com",
  projectId: "prompt-metal",
  storageBucket: "prompt-metal.firebasestorage.app",
  messagingSenderId: "307567224548",
  appId: "1:307567224548:web:92b65cfb9bd4e82071eef1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;