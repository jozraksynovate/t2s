"use client"

import { Link } from "@/i18n/routing"
import { useTranslations, useFormatter } from "next-intl"
import { usePathname } from "@/i18n/routing"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSearchParams } from "next/navigation"
import React from "react"
import { useAuth } from "@/hooks/use-auth"
import { CREDIT_CONSTANTS } from "@/lib/data"
import { TopupDialog } from "@/components/topup-dialog"

export function AppHeader() {
  const pathname = usePathname()
  const { userData, loading: authLoading } = useAuth()
  const format = useFormatter()
  const t = useTranslations('Navigation')
  const tNavUser = useTranslations('NavUser')
  const tNew = useTranslations('NewProject')
  const tStudio = useTranslations('Studio')
  const searchParams = useSearchParams()
  const projectNameParam = searchParams.get('name')
  const [dynamicProjectName, setDynamicProjectName] = React.useState<string | null>(null)

  React.useEffect(() => {
    const handleProjectLoaded = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string }>;
      if (customEvent.detail?.title) {
        setDynamicProjectName(customEvent.detail.title);
      }
    };
    window.addEventListener("project-loaded", handleProjectLoaded);
    return () => {
      window.removeEventListener("project-loaded", handleProjectLoaded);
    };
  }, []);
  
  // With next-intl's usePathname, the locale is already stripped.
  // Example: /app/studio (even if the URL is /en/app/studio)
  const pathSegments = pathname.split("/").filter(Boolean)

  const credits = userData?.credits ?? 0
  const isLongCredits = credits >= CREDIT_CONSTANTS.COMPACT_THRESHOLD

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto hidden md:block"
      />
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/app">{t('home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {pathSegments.length > 2 ? (
                  <BreadcrumbLink asChild>
                    <Link href={`/${pathSegments[0]}/${pathSegments[1]}`}>
                      {t.has(pathSegments[1]) 
                        ? t(pathSegments[1]) 
                        : pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1)}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>
                    {t.has(pathSegments[1]) 
                      ? t(pathSegments[1]) 
                      : pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1)}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {pathSegments.length > 2 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {dynamicProjectName || projectNameParam || pathSegments[2]
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        {pathname === "/app/studio" && (
          <Button 
            onClick={() => window.dispatchEvent(new CustomEvent("open-new-project"))}
          >
            {tNew('trigger')}
          </Button>
        )}
        {pathSegments.length >= 3 && pathSegments[0] === "app" && pathSegments[1] === "studio" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <TopupDialog>
                  <Button variant="ghost" className="px-2 font-medium">
                    {isLongCredits 
                      ? format.number(credits, { notation: 'compact', compactDisplay: 'short' }) 
                      : format.number(credits)}
                  </Button>
                </TopupDialog>
              </TooltipTrigger>
              <TooltipContent>
                {tNavUser('creditsTooltip', { count: format.number(credits) })}
              </TooltipContent>
            </Tooltip>
            
            <Button variant="outline">
              {tStudio('docs')}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => window.dispatchEvent(new CustomEvent("trigger-export"))}>
                  {tStudio('export')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {tStudio('exportTooltip')}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </header>
  )
}
