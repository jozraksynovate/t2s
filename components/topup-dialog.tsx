"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations, useFormatter, useLocale } from "next-intl"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { CREDIT_CONSTANTS } from "@/lib/data"
import { Minus, Plus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"

interface TopupDialogProps {
  children?: React.ReactNode
}

export function TopupDialog({ children }: TopupDialogProps) {
  const t = useTranslations("Billing")
  const tCommon = useTranslations("ProjectItem")
  const format = useFormatter()
  const locale = useLocale()
  const { user, getFreshToken } = useAuth()
  const [amount, setAmount] = React.useState<number>(100000)
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const step = 50000
  const minAmount = 100000

  const handleIncrement = () => setAmount(prev => prev + step)
  const handleDecrement = () => setAmount(prev => Math.max(minAmount, prev - step))

  const price = amount * CREDIT_CONSTANTS.PRICE_PER_CREDIT
  const currency = "IDR"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const token = await getFreshToken()
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: price,
          credits: amount
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "CHECKOUT_FAILED")
      }

      const { paymentUrl } = await response.json()

      // Redirect user to DOKU Payment Page
      window.location.href = paymentUrl
    } catch (err: any) {
      console.error("Payment error:", err)
      toast.error(err.message || t("error"))
    } finally {
      setLoading(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">Top Up</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <FieldGroup>
              <Field>
                <Label htmlFor="topup-amount">{t("amountLabel")}</Label>
                <ButtonGroup className="mt-3">
                  <Input
                    id="topup-amount"
                    type="text"
                    value={format.number(amount)}
                    readOnly
                    placeholder={t("amountPlaceholder")}
                    className="flex-1 cursor-default focus-visible:ring-1 focus-visible:ring-muted shadow-none"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleDecrement}
                    disabled={amount <= minAmount || loading}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleIncrement}
                    disabled={loading}
                  >
                    <Plus className="size-4" />
                  </Button>
                </ButtonGroup>
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={loading}>
                {tCommon("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  {t("processing")}
                </>
              ) : (
                `${t("submit")} ${format.number(price, { 
                  style: 'currency', 
                  currency: currency,
                  notation: 'compact',
                  maximumFractionDigits: 0
                })}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
