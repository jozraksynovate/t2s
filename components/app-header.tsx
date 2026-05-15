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
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import React from "react"

export function AppHeader() {
  const pathname = usePathname()
  const t = useTranslations('Navigation')
  
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
                <BreadcrumbPage>
                  {t.has(pathSegments[1]) 
                    ? t(pathSegments[1]) 
                    : pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
