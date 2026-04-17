"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@minnjii/dx-kit/ui/sidebar";
import {
  FileText,
  Calendar,
  FolderTree,
  Settings,
  Lock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useCrypto } from "@/components/providers/crypto-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { useCategories } from "@/hooks/use-categories";
import { CategoryTree } from "./category-tree";
import { CategoryDialog } from "@/components/dialogs/category-dialog";

export function AppSidebar() {
  const pathname = usePathname();
  const { lock } = useCrypto();
  const { t } = useLanguage();
  const { createCategory } = useCategories();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const NAV_ITEMS = [
    { href: "/notes", label: t("nav.allNotes"), icon: FileText },
    { href: "/notes/calendar", label: t("nav.calendar"), icon: Calendar },
    { href: "/notes/categories", label: t("nav.categories"), icon: FolderTree },
  ];

  return (
    <>
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="basic note">
              <Link href="/notes">
                <span className="logo-icon size-4 shrink-0 rounded-sm bg-foreground text-background text-[10px] font-bold leading-none text-center mt-[8px]" style={{lineHeight:"16px"}}>b</span>
                <span className="font-semibold tracking-tight text-sm">basic note</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup className="mt-[10px]">
          <SidebarGroupLabel className="sr-only">탐색</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="nav-icon h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Categories */}
        <SidebarGroup className="mt-[11px]">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setCategoryDialogOpen(true)} tooltip={t("categoryDialog.title")}>
                  <Plus className="h-4 w-4" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <CategoryTree />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("nav.settings")}>
              <Link href="/settings">
                <Settings />
                <span>{t("nav.settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={lock} tooltip={t("nav.lock")}>
              <Lock />
              <span>{t("nav.lock")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>

    <CategoryDialog
      open={categoryDialogOpen}
      onOpenChange={setCategoryDialogOpen}
      onSubmit={async (name) => {
        await createCategory(name);
        toast.success(t("categoryDialog.added"));
      }}
    />
    </>
  );
}
