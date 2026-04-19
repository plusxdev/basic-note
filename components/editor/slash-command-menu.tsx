"use client";

import { useEffect, useRef, useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@minnjii/dx-kit/ui/command";
import { useLanguage } from "@/components/providers/language-provider";
import { BLOCK_ICON_MAP, BLOCK_ITEMS } from "./block-type-items";
import type { BlockType } from "@/lib/types";

interface SlashCommandMenuProps {
  open: boolean;
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function SlashCommandMenu({
  open,
  position,
  onSelect,
  onClose,
}: SlashCommandMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50"
      style={{ top: position.top, left: position.left }}
    >
      <Command className="w-64 shadow-lg shadow-black/20 rounded-xl bg-popover">
        <CommandInput
          placeholder={t("placeholder.searchBlock")}
          value={search}
          onValueChange={setSearch}
          autoFocus
        />
        <CommandList>
          <CommandEmpty>{t("block.noResult")}</CommandEmpty>
          <CommandGroup>
            {BLOCK_ITEMS.map((item) => {
              const Icon = BLOCK_ICON_MAP[item.type];
              const label = t(item.labelKey);
              return (
                <CommandItem
                  key={item.type}
                  value={label}
                  onSelect={() => onSelect(item.type)}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(item.descKey)}
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
