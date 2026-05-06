"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@minnjii/dx-kit/ui/sidebar";
import { TooltipProvider } from "@minnjii/dx-kit/ui/tooltip";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { GlobalNavTabs } from "@/components/layout/global-nav-tabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 px-6">
            <span className="contents md:hidden">
              <SidebarTrigger className="-ml-2 mt-[3px]" />
            </span>
            <GlobalNavTabs />
          </header>
          <main className="flex-1 overflow-auto px-6 pb-6 pt-[10px]">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
