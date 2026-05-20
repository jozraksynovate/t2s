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
import { AuthGuard } from "@/components/auth-guard"


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
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="flex h-screen flex-col overflow-hidden">
        <AppHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AuthGuard>
            {children}
          </AuthGuard>
        </div>
      </SidebarInset>
      <CommandMenu />
      <NewProjectDialog showTrigger={false} />
    </SidebarProvider>
  )
}
