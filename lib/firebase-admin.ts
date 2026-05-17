import * as admin from "firebase-admin"

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Under Google ADC (Application Default Credentials), Firebase Admin SDK
      // automatically fetches the active credentials from the system environment.
      // We pass the project ID from environment variables so the SDK knows which project's
      // client tokens to verify against.
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
    console.log("[Firebase Admin] Initialized successfully using Google ADC.")
  } catch (error) {
    console.error("[Firebase Admin] Initialization error:", error)
  }
}

export const adminAuth = admin.auth()
