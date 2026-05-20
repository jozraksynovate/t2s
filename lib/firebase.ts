import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

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
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:817164022237:web:2120e7ff96464137a98634",
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
  .filter(([, value]) => !value)
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

// Mencegah crash jika inisialisasi getAuth gagal akibat kunci API tidak valid saat build-time
export const auth = (() => {
  try {
    return getAuth(app)
  } catch (error) {
    if (typeof window !== "undefined") {
      console.error("[Firebase Client] Failed to retrieve Auth service instance:", error)
    }
    // Mengembalikan objek Auth mock agar proses kompilasi Next.js tidak crash
    return {
      currentUser: null,
      onAuthStateChanged: () => {
        // Mengembalikan fungsi unsubscribe dummy
        return () => {}
      },
    } as unknown as ReturnType<typeof getAuth>
  }
})()

export const googleProvider = new GoogleAuthProvider()

// Menginisialisasi Firestore DB
export const db = (() => {
  try {
    return getFirestore(app)
  } catch (error) {
    if (typeof window !== "undefined") {
      console.error("[Firebase Client] Failed to retrieve Firestore DB instance:", error)
    }
    return {} as unknown as ReturnType<typeof getFirestore>
  }
})()
