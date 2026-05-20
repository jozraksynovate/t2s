"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useTranslations } from "next-intl"
import { getUserProjects, type Project } from "@/lib/firestore-service"
import { ProjectItem } from "./project-item"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { FolderCode, ArrowUpRight } from "lucide-react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function ProjectList() {
  const { user } = useAuth()
  const t = useTranslations("EmptyState")
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) return

    const unsubscribe = getUserProjects(user.uid, (data) => {
      setProjects(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <Empty className="h-full border border-dashed border-border animate-in fade-in duration-300">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCode />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>
            {t("description")}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button 
            onClick={() => window.dispatchEvent(new CustomEvent("open-new-project"))}
          >
            {t("createButton")}
          </Button>
          <Button variant="outline">
            {t("importButton")}
          </Button>
        </EmptyContent>
        <Button
          variant="link"
          asChild
          className="text-muted-foreground"
          size="sm"
        >
          <a href="#" className="gap-1 flex items-center justify-center">
            {t("learnMore")} <ArrowUpRight className="h-4 w-4" />
          </a>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {projects.map((project) => {
        const blockText = project.blocks && project.blocks.length > 0
          ? project.blocks.map(b => b.text).filter(Boolean).join(" ")
          : ""
        const displayDescription = blockText.trim() || project.description || ""

        return (
          <ProjectItem 
            key={project.id}
            id={project.id}
            title={project.title} 
            description={displayDescription} 
          />
        )
      })}
    </div>
  )
}
