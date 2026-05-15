"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldError, FieldLabel } from "@/components/ui/field"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface NewProjectDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export function NewProjectDialog({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  showTrigger = true 
}: NewProjectDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen
  
  const router = useRouter()
  const t = useTranslations('NewProject')
  const tCommon = useTranslations('ProjectItem')

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
    },
  })

  // Listen for global event to open the dialog
  React.useEffect(() => {
    const handleOpen = () => {
      setOpen(true)
    }
    window.addEventListener("open-new-project", handleOpen)
    return () => window.removeEventListener("open-new-project", handleOpen)
  }, [setOpen])

  const onSubmit = (values: ProjectFormValues) => {
    setOpen(false)
    const slug = values.name.toLowerCase().trim().replace(/\s+/g, '-')
    router.push(`/app/studio/${slug}?name=${encodeURIComponent(values.name)}`)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>{t('trigger')}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>
              {t('description')}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="new-project-name">{t('nameLabel')}</FieldLabel>
              <Input 
                id="new-project-name" 
                {...form.register("name")}
                aria-invalid={!!form.formState.errors.name}
                placeholder={t('namePlaceholder')}
                autoFocus
              />
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {tCommon('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit">
              {t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
