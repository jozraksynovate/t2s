import { cookies } from "next/headers"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import React from "react"
import { AppHeader } from "@/components/app-header"
import { setRequestLocale } from 'next-intl/server';

import { CommandMenu } from "@/components/command-menu"
import { NewProjectDialog } from "@/components/new-project-dialog"

export default async function AppLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="flex h-screen flex-col overflow-hidden">
        <AppHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>
      <CommandMenu />
      <NewProjectDialog showTrigger={false} />
    </SidebarProvider>
  )
}
