"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link, useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const t = useTranslations("Auth")
  const { signInWithEmail, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const handleAuthError = (err: any) => {
    const code = err?.code || ""
    let message = ""
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      message = t("authInvalidCredential")
    } else if (code === "auth/email-already-in-use") {
      message = t("authEmailAlreadyInUse")
    } else if (code === "auth/weak-password") {
      message = t("authWeakPassword")
    } else if (code === "auth/network-request-failed") {
      message = t("authNetworkError")
    } else {
      message = t("authUnknownError", { error: err?.message || String(err) })
    }
    toast.error(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || isGoogleSubmitting) return

    setIsSubmitting(true)
    try {
      await signInWithEmail(email, password)
      toast.success(t("loginSuccessToast"))
      router.push("/app")
    } catch (err) {
      handleAuthError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (isSubmitting || isGoogleSubmitting) return

    setIsGoogleSubmitting(true)
    try {
      await signInWithGoogle()
      toast.success(t("loginSuccessToast"))
      router.push("/app")
    } catch (err) {
      handleAuthError(err)
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  const isAnyLoading = isSubmitting || isGoogleSubmitting

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6 w-full max-w-sm", className)}
      {...props}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginDescription")}</CardDescription>
          <CardAction>
            <Button variant="link" asChild disabled={isAnyLoading}>
              <Link href="/signup">{t("signUpLinkAction")}</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAnyLoading}
                required
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  {t("forgotPassword")}
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isAnyLoading}
                required
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isAnyLoading}>
            {isSubmitting ? (
              <>
                <Spinner />
                {t("loginButton")}...
              </>
            ) : (
              t("loginButton")
            )}
          </Button>
          <Button
            onClick={handleGoogleSignIn}
            type="button"
            variant="outline"
            className="w-full"
            disabled={isAnyLoading}
          >
            {isGoogleSubmitting ? (
              <>
                <Spinner />
                {t("loginWithGoogle")}...
              </>
            ) : (
              t("loginWithGoogle")
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
