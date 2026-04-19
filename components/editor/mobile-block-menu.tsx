"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@minnjii/dx-kit/ui/drawer";
import { Plus } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { BLOCK_ICON_MAP, BLOCK_ITEMS } from "./block-type-items";
import type { BlockType } from "@/lib/types";

interface MobileBlockMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: BlockType) => void;
}

export function MobileBlockMenu({
  open,
  onOpenChange,
  onSelect,
}: MobileBlockMenuProps) {
  const { t } = useLanguage();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("block.addTitle")}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("block.addTitle")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid grid-cols-2 gap-2 px-4 pb-6">
          {BLOCK_ITEMS.map((item) => {
            const Icon = BLOCK_ICON_MAP[item.type];
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  onSelect(item.type);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-left transition-colors active:bg-muted"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {t(item.labelKey)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t(item.descKey)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
