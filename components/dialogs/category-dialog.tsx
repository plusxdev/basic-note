"use client";

import { useEffect, useState } from "react";
import { Button } from "@minnjii/dx-kit/ui/button";
import { Input } from "@minnjii/dx-kit/ui/input";
import { Label } from "@minnjii/dx-kit/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@minnjii/dx-kit/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  defaultName?: string;
  title?: string;
  description?: string;
}

export function CategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultName = "",
  title: titleProp,
  description: descProp,
}: CategoryDialogProps) {
  const { t } = useLanguage();
  const title = titleProp ?? t("categoryDialog.title");
  const description = descProp ?? t("categoryDialog.desc");
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim());
      setName("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("categoryDialog.placeholder")}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("categoryDialog.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? t("categoryDialog.saving") : t("categoryDialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
