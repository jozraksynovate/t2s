"use client"

import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
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
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useSearchParams } from "next/navigation"
import React from "react"

export function AppHeader() {
  const pathname = usePathname()
  const t = useTranslations('Navigation')
  const tNew = useTranslations('NewProject')
  const tStudio = useTranslations('Studio')
  const searchParams = useSearchParams()
  const projectNameParam = searchParams.get('name')
  
  // With next-intl's usePathname, the locale is already stripped.
  // Example: /app/studio (even if the URL is /en/app/studio)
  const pathSegments = pathname.split("/").filter(Boolean)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <Breadcrumb>
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
                  {projectNameParam || pathSegments[2]
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
            <Button variant="outline">
              {tStudio('docs')}
            </Button>
            <Button>
              {tStudio('export')}
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
