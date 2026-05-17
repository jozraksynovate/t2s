import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const rawProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

// Mendeteksi apakah pemanggilan terjadi saat kompilasi (build time) atau kuncinya kosong
const isBuildTime = typeof window === "undefined" && (!rawApiKey || process.env.NEXT_PHASE === "phase-production-build")

const firebaseConfig = {
  apiKey: rawApiKey || "AIzaSyMockAPIKeyForNextJSBuildTimeOnly",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: rawProjectId || "mock-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:mockapphash",
}

// Cek kunci kosong hanya saat runtime di browser untuk membimbing developer
const missingClientKeys = Object.entries({
  apiKey: rawApiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: rawProjectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
})
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingClientKeys.length > 0 && !isBuildTime) {
  if (typeof window !== "undefined") {
    console.warn(
      `[Firebase Client Setup Warning] ⚠️ Missing configuration key(s): ${missingClientKeys.join(", ")}. ` +
      `Please copy .env.example to .env.local and configure your Firebase credentials.`
    )
  }
}

// Mencegah error duplikasi inisialisasi pada Next.js HMR (Hot Module Replacement)
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} catch (error) {
  if (typeof window !== "undefined") {
    console.error("[Firebase Client] Failed to initialize Firebase App:", error)
  }
  // Alternatif mock aman agar module evaluation tidak menyebabkan crash kompilasi
  app = getApps().length > 0 ? getApp() : initializeApp({ apiKey: "AIzaSyMockAPIKeyForNextJSBuildTimeOnly", projectId: "mock-project-id" })
}

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
