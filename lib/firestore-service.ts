import { db } from "./firebase"
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot
} from "firebase/firestore"
import { Speaker, SpeechBlock, DEFAULT_SPEAKERS } from "./studio"

export interface Project {
  id: string
  userId: string
  title: string
  description: string
  speakers: Speaker[]
  blocks: SpeechBlock[]
  globalConfig: {
    scene: string
    sampleContext: string
  }
  createdAt: unknown
  updatedAt: unknown
}

const COLLECTION_NAME = "projects"

/**
 * Creates a new project in Firestore for the specified user.
 * @param userId Firebase Auth UID of the owner
 * @param title Project title/name
 * @param description Project description
 * @returns ID of the newly created project document
 */
export async function createProject(
  userId: string,
  title: string,
  description = ""
): Promise<string> {
  const newProjectData = {
    userId,
    title,
    description,
    speakers: DEFAULT_SPEAKERS,
    blocks: [
      { id: "first-block-id", speakerId: 1, text: "" }
    ],
    globalConfig: {
      scene: "",
      sampleContext: ""
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), newProjectData)
  return docRef.id
}

/**
 * Gets a single project by ID and verifies ownership.
 */
export async function getProject(
  projectId: string,
  userId: string
): Promise<Project | null> {
  const docRef = doc(db, COLLECTION_NAME, projectId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const data = docSnap.data()
    if (data.userId !== userId) {
      throw new Error("Unauthorized to access this project.")
    }
    return {
      id: docSnap.id,
      ...data
    } as Project
  }

  return null
}

/**
 * Updates an existing project in Firestore.
 */
export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<Omit<Project, "id" | "userId" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, projectId)
  
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  })
}

/**
 * Deletes a project from Firestore.
 */
export async function deleteProject(
  projectId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, projectId)
  
  await deleteDoc(docRef)
}

/**
 * Subscribes to real-time updates for a user's projects.
 */
export function getUserProjects(
  userId: string,
  callback: (projects: Project[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  )

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const projects: Project[] = []
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        } as Project)
      })
      callback(projects)
    },
    (error) => {
      console.error("Error in real-time user projects subscription:", error)
    }
  )

  return unsubscribe
}

export interface Transaction {
  id: string
  userId: string
  type: "purchase" | "usage" | "refund"
  status?: "pending" | "success" | "failed"
  amount: number
  priceInIdr?: number
  invoiceNumber?: string
  metadata?: any
  createdAt: any
  completedAt?: any
}

/**
 * Subscribes to real-time updates for a user's transaction history.
 */
export function getUserTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
): () => void {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  )

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const transactions: Transaction[] = []
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as Transaction)
      })
      callback(transactions)
    },
    (error) => {
      console.error("Error in real-time user transactions subscription:", error)
    }
  )

  return unsubscribe
}
