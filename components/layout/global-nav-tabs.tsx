"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Calendar, FolderTree } from "lucide-react";
import { cn } from "@plus-experience/design-system/lib/utils";

const VIEW_TABS = [
  { href: "/notes", label: "모든 노트", icon: FileText },
  { href: "/notes/calendar", label: "캘린더", icon: Calendar },
  { href: "/notes/categories", label: "카테고리", icon: FolderTree },
] as const;

export function GlobalNavTabs() {
  const pathname = usePathname();
  const isTabActive = (href: string) => {
    if (href === "/notes") return pathname === "/notes";
    return pathname.startsWith(href);
  };
  return (
    <nav className="flex items-center gap-1 mt-0.5">
      {VIEW_TABS.map((tab) => {
        const active = isTabActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
