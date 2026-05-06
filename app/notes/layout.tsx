"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@minnjii/dx-kit/ui/sidebar";
import { TooltipProvider } from "@minnjii/dx-kit/ui/tooltip";
import { Spinner } from "@minnjii/dx-kit/ui/spinner";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { GlobalNavTabs } from "@/components/layout/global-nav-tabs";
import {
  GlobalLoadingProvider,
  useGlobalLoading,
} from "@/components/providers/global-loading";
import { NotesCountProvider } from "@/components/providers/notes-count-provider";

function HeaderLoadingIndicator() {
  const { isLoading } = useGlobalLoading();
  if (!isLoading) return null;
  return <Spinner className="h-4 w-4 text-muted-foreground" />;
}

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <GlobalLoadingProvider>
        <NotesCountProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 shrink-0 items-center gap-2 px-6">
                <span className="contents md:hidden">
                  <SidebarTrigger className="-ml-2 mt-[3px]" />
                </span>
                <GlobalNavTabs />
                <div className="ml-auto flex items-center">
                  <HeaderLoadingIndicator />
                </div>
              </header>
              <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-x-none overscroll-y-contain px-6 pb-6 pt-[10px]">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </NotesCountProvider>
      </GlobalLoadingProvider>
    </TooltipProvider>
  );
}
