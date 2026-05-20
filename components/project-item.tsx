"use client"

import * as React from "react"
import { MoreVertical, Share2, Pencil, Trash2 } from "lucide-react"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldGroup, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useAuth } from "@/hooks/use-auth"
import { updateProject, deleteProject } from "@/lib/firestore-service"

interface ProjectItemProps {
  id: string
  title: string
  description: string
}

const renameSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

type RenameFormValues = z.infer<typeof renameSchema>

export function ProjectItem({ id, title, description }: ProjectItemProps) {
  const [open, setOpen] = React.useState(false)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const { user } = useAuth()
  const t = useTranslations('ProjectItem')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/app/studio/${id}` : ''

  const form = useForm<RenameFormValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      name: title,
    },
  })

  // Keep form default value synced when title changes from external updates
  React.useEffect(() => {
    form.reset({ name: title })
  }, [title, form])

  const handleCopy = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success(t('shareSuccess'))
      }).catch((err) => {
        console.error('Failed to copy: ', err)
        toast.error('Failed to copy to clipboard')
      })
    } else {
      // Robust fallback for insecure contexts (HTTP LAN IP on mobile devices)
      try {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        textarea.style.position = 'fixed'
        textarea.style.top = '0'
        textarea.style.left = '0'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)
        
        if (successful) {
          toast.success(t('shareSuccess'))
        } else {
          throw new Error('execCommand returned false')
        }
      } catch (err) {
        console.error('Fallback copy failed: ', err)
        toast.error('Failed to copy to clipboard')
      }
    }
  }

  const onRenameSubmit = async (values: RenameFormValues) => {
    if (!user) return
    setIsRenaming(true)
    try {
      await updateProject(id, user.uid, { title: values.name })
      setRenameOpen(false)
      toast.success(t('renameSuccess', { name: values.name }))
    } catch (err) {
      console.error("Error renaming project:", err)
      toast.error(t('renameError') || "Failed to rename project")
    } finally {
      setIsRenaming(false)
    }
  }

  const onDeleteConfirm = async () => {
    if (!user) return
    setIsDeleting(true)
    try {
      await deleteProject(id, user.uid)
      setDeleteOpen(false)
      toast.success(t('deleteSuccess', { name: title }))
    } catch (err) {
      console.error("Error deleting project:", err)
      toast.error(t('deleteError') || "Failed to delete project")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Item variant="outline" className="flex-nowrap" asChild>
        <Link href={`/app/studio/${id}`}>
          <ItemContent className="min-w-0 flex-1">
            <ItemTitle className="line-clamp-1 truncate block w-full">{title}</ItemTitle>
            <ItemDescription className="line-clamp-1 truncate block w-full">{description || t('noDescription')}</ItemDescription>
          </ItemContent>
          <ItemActions className="shrink-0">
            <DropdownMenu onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`size-8 rounded-full transition-opacity duration-150 ${
                    menuOpen 
                      ? "opacity-100" 
                      : "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/item:opacity-100 focus-visible:opacity-100"
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <MoreVertical className="size-4" />
                  <span className="sr-only">{t('menuTooltip')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onSelect={() => {
                    handleCopy()
                    setOpen(true)
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Share2 />
                  {t('share')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={() => {
                    form.reset({ name: title })
                    setRenameOpen(true)
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil />
                  {t('rename')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  variant="destructive"
                  onSelect={() => setDeleteOpen(true)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ItemActions>
        </Link>
      </Item>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('shareTitle')}</DialogTitle>
            <DialogDescription>
              {t('shareDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                defaultValue={shareUrl}
                readOnly
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button">
                {t('close')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <form onSubmit={form.handleSubmit(onRenameSubmit)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t('renameTitle')}</DialogTitle>
              <DialogDescription>
                {t('renameDescription')}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="project-name">{t('nameLabel')}</FieldLabel>
                <Input 
                  id="project-name" 
                  {...form.register("name")}
                  aria-invalid={!!form.formState.errors.name}
                  autoFocus
                />
                {form.formState.errors.name && (
                  <FieldError>{form.formState.errors.name.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isRenaming}>
                  {t('cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isRenaming || !form.formState.isDirty}>
                {isRenaming && <Spinner />}
                {isRenaming ? t('saving') : t('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { name: title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={(e) => {
                e.stopPropagation()
              }}
              disabled={isDeleting}
            >
              {t('deleteCancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation()
                if (isDeleting) return
                onDeleteConfirm()
              }}
              variant="destructive"
            >
              {isDeleting && <Spinner />}
              {isDeleting ? t('deleting') : t('deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
