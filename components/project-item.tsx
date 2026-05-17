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

interface ProjectItemProps {
  title: string
  description: string
}

const renameSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

type RenameFormValues = z.infer<typeof renameSchema>

export function ProjectItem({ title, description }: ProjectItemProps) {
  const [open, setOpen] = React.useState(false)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const t = useTranslations('ProjectItem')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/app/studio/linkproject` : ''

  const form = useForm<RenameFormValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      name: title,
    },
  })

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

  const onRenameSubmit = (values: RenameFormValues) => {
    setRenameOpen(false)
    toast.success(t('renameSuccess', { name: values.name }), {
      action: {
        label: t('undo'),
        onClick: () => console.log("Undo rename"),
      },
    })
  }

  const onDeleteConfirm = () => {
    setDeleteOpen(false)
    toast.success(t('deleteSuccess', { name: title }), {
      action: {
        label: t('undo'),
        onClick: () => console.log("Undo delete"),
      },
    })
  }

  const projectSlug = title.toLowerCase().trim().replace(/\s+/g, '-')

  return (
    <>
      <Item variant="outline" asChild>
        <Link href={`/app/studio/${projectSlug}`}>
          <ItemContent>
            <ItemTitle className="line-clamp-1">{title}</ItemTitle>
            <ItemDescription className="line-clamp-1">{description}</ItemDescription>
          </ItemContent>
          <ItemActions>
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
                <Button type="button" variant="outline">
                  {t('cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!form.formState.isDirty}>
                {t('saveChanges')}
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
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              {t('deleteCancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation()
                onDeleteConfirm()
              }}
              variant="destructive"
            >
              {t('deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
