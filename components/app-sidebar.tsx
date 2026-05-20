"use client"

import * as React from "react"
import { Link } from "@/i18n/routing"
import { useTranslations } from 'next-intl'
import {
  Home,
  LayoutGrid,
  CreditCard,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/hooks/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('Navigation');
  const { user } = useAuth()

  const userData = {
    name: user?.displayName || user?.email?.split('@')[0] || "User",
    email: user?.email || "",
    avatar: user?.photoURL || "",
  }

  const navMain = [
    {
      title: t('home'),
      url: "/app",
      icon: Home,
    },
    {
      title: t('studio'),
      url: "/app/studio",
      icon: LayoutGrid,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('platform')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
