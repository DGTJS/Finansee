"use client";

import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export function DashboardNavbar() {
  return <nav className="fixed inset-x-0 top-0 z-30 hidden h-16 items-center justify-end border-b border-border bg-background/95 px-6 backdrop-blur lg:flex lg:pl-72" aria-label="Navegação da conta"><div className="flex items-center gap-2"><NotificationsPanel /><ThemeToggle /><ProfileMenu /></div></nav>;
}
