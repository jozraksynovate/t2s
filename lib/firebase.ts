import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check for missing keys to guide developers during migration/setup
const missingClientKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingClientKeys.length > 0) {
  if (typeof window !== "undefined") {
    console.warn(
      `[Firebase Client Setup Warning] ⚠️ Missing configuration key(s): ${missingClientKeys.join(", ")}. ` +
      `Please copy .env.example to .env.local and configure your Firebase credentials.`
    )
  }
}

// Avoid initializing multiple times during Next.js Hot Module Replacement (HMR)
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} catch (error) {
  if (typeof window !== "undefined") {
    console.error("[Firebase Client] Failed to initialize Firebase App:", error)
  }
  // Safe mock app object to prevent fatal application crashes on import
  app = getApps().length > 0 ? getApp() : initializeApp({ apiKey: "mock-api-key", projectId: "mock-project-id" })
}

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
