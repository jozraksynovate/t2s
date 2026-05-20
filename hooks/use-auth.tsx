"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { auth, googleProvider, db } from "@/lib/firebase"

interface UserData {
  credits: number
  updatedAt?: any
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<User>
  signUpWithEmail: (name: string, email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  logout: () => Promise<void>
  getFreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | undefined

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // Listen to user document for credits and other metadata
        const userDocRef = doc(db, "users", firebaseUser.uid)
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData)
          } else {
            setUserData(null)
          }
        }, (error) => {
          console.error("Error listening to user data:", error)
        })
      } else {
        setUserData(null)
        if (unsubscribeFirestore) {
          unsubscribeFirestore()
        }
      }
      
      setLoading(false)
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeFirestore) unsubscribeFirestore()
    }
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      return credential.user
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      // Save display name into Firebase Auth user profile
      await updateProfile(credential.user, {
        displayName: name,
      })
      // Force refresh user profile state
      const updatedUser = auth.currentUser
      if (updatedUser) {
        setUser({ ...updatedUser } as User)
      }
      return credential.user
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const credential = await signInWithPopup(auth, googleProvider)
      return credential.user
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } finally {
      setLoading(false)
    }
  }

  const getFreshToken = async () => {
    if (!auth.currentUser) return null
    return auth.currentUser.getIdToken(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        getFreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
