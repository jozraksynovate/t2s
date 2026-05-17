"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link, useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

interface LoginFormValues {
  email: string
  password: string
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const t = useTranslations("Auth")
  const { signInWithEmail, signInWithGoogle } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const schema = React.useMemo(() => z.object({
    email: z.string()
      .min(1, t("emailRequired"))
      .email(t("invalidEmail"))
      .max(255, t("emailMaxLength")),
    password: z.string()
      .min(1, t("passwordRequired"))
      .min(8, t("passwordMinLength")),
  }), [t])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleAuthError = (err: unknown) => {
    const errorObj = err as { code?: string; message?: string } | null | undefined
    const code = errorObj?.code || ""
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
      message = t("authUnknownError", { error: errorObj?.message || String(err) })
    }
    toast.error(message)
  }

  const onSubmit = async (values: LoginFormValues) => {
    if (isSubmitting || isGoogleSubmitting) return

    setIsSubmitting(true)
    try {
      await signInWithEmail(values.email, values.password)
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
      onSubmit={form.handleSubmit(onSubmit)}
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
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                {...form.register("email")}
                aria-invalid={!!form.formState.errors.email}
                disabled={isAnyLoading}
              />
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <Field data-invalid={!!form.formState.errors.password}>
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
                {...form.register("password")}
                aria-invalid={!!form.formState.errors.password}
                disabled={isAnyLoading}
              />
              {form.formState.errors.password && (
                <FieldError>{form.formState.errors.password.message}</FieldError>
              )}
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
