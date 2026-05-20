"use client"

import * as React from "react"
import {
  CreditCard,
  Home,
  LayoutGrid,
  PlusCircle,
  FolderOpen,
  Settings,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/hooks/use-auth"
import { getUserProjects, type Project } from "@/lib/firestore-service"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [projects, setProjects] = React.useState<Project[]>([])
  const t = useTranslations("CommandMenu")
  const tNav = useTranslations("Navigation")
  const router = useRouter()
  const { user } = useAuth()

  React.useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setProjects([])
      }, 0)
      return () => clearTimeout(timer)
    }

    const unsubscribe = getUserProjects(user.uid, (data) => {
      setProjects(data)
    })

    return () => unsubscribe()
  }, [user])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
      title={t("navigation")}
      description={t("searchPlaceholder")}
    >
      <CommandInput placeholder={t("searchPlaceholder")} />
      <CommandList>
        <CommandEmpty>{t("emptyResults")}</CommandEmpty>
        
        <CommandGroup heading={t("navigation")}>
          <CommandItem onSelect={() => runCommand(() => router.push("/app"))}>
            <Home />
            <span>{tNav("home")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/app/studio"))}>
            <LayoutGrid />
            <span>{tNav("studio")}</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading={t("actions")}>
          <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent("open-new-project")))}>
            <PlusCircle />
            <span>{t("newProject")}</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading={t("account")}>
          <CommandItem onSelect={() => runCommand(() => router.push("/app/settings"))}>
            <Settings />
            <span>{tNav("settings")}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/app/billing"))}>
            <CreditCard />
            <span>{tNav("billing")}</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading={t("projects")}>
          {projects.map((project) => (
            <CommandItem 
              key={project.id}
              onSelect={() => runCommand(() => router.push(`/app/studio/${project.id}`))}
            >
              <FolderOpen />
              <span>{project.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
