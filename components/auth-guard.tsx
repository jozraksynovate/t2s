"use client"

import React, { useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/hooks/use-auth"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return null
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
