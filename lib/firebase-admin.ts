import * as admin from "firebase-admin"

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

if (!admin.apps.length) {
  try {
    if (!projectId) {
      console.warn(
        "[Firebase Admin Setup Warning] ⚠️ NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined. " +
        "Firebase Admin authentication will fail to verify client tokens."
      )
    }
    admin.initializeApp({
      // Under Google ADC (Application Default Credentials), Firebase Admin SDK
      // automatically fetches the active credentials from the system environment.
      // We pass the project ID from environment variables so the SDK knows which project's
      // client tokens to verify against.
      projectId: projectId || undefined,
    })
    console.log("[Firebase Admin] Initialized successfully.")
  } catch (error) {
    console.error("[Firebase Admin] Initialization error:", error)
  }
}

// Safely export auth and firestore instances, preventing import-time crashes on missing environments
export const adminAuth = (() => {
  try {
    return admin.auth()
  } catch (error) {
    console.error("[Firebase Admin] Failed to retrieve Auth service instance:", error)
    return {
      verifyIdToken: async () => {
        throw new Error("Firebase Admin SDK is not properly configured. Check your environment variables.")
      }
    } as unknown as admin.auth.Auth
  }
})()

export const adminDb = (() => {
  try {
    return admin.firestore()
  } catch (error) {
    console.error("[Firebase Admin] Failed to retrieve Firestore service instance:", error)
    return {
      collection: () => {
        throw new Error("Firebase Admin SDK is not properly configured. Check your environment variables.")
      }
    } as unknown as admin.firestore.Firestore
  }
})()
