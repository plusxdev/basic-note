"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Upload,
  Lock,
  Keyboard,
  Shield,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@minnjii/dx-kit/ui/card";
import { Button } from "@minnjii/dx-kit/ui/button";
import { Input } from "@minnjii/dx-kit/ui/input";
import { Label } from "@minnjii/dx-kit/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@minnjii/dx-kit/ui/select";
import { Separator } from "@minnjii/dx-kit/ui/separator";
import { Kbd } from "@minnjii/dx-kit/ui/kbd";
import { useCrypto } from "@/components/providers/crypto-provider";
import { useLanguage } from "@/components/providers/language-provider";
import type { Language } from "@/lib/i18n";
import { db } from "@/lib/db";
import type { Category, Note, Block } from "@/lib/types";

// ─── Export / Import Types ───────────────────────────────────
interface ExportData {
  version: 1;
  exportedAt: string;
  categories: (Omit<Category, "name"> & { name: string })[];
  notes: (Omit<Note, "title"> & { title: string })[];
  blocks: (Omit<Block, "content"> & { content: string })[];
}

export default function SettingsPage() {
  const {
    lockTimeoutMinutes,
    setLockTimeout,
    encryptText,
    decryptText,
    lock,
    changePassword,
    getRecoveryKey,
  } = useCrypto();

  const { t, language, setLanguage } = useLanguage();

  // ─── Lock Timeout Options ────────────────────────────────────
  const TIMEOUT_OPTIONS = [
    { value: "1", label: t("timeout.1") },
    { value: "5", label: t("timeout.5") },
    { value: "15", label: t("timeout.15") },
    { value: "30", label: t("timeout.30") },
    { value: "0", label: t("timeout.0") },
  ];

  // ─── Keyboard Shortcuts ──────────────────────────────────────
  const SHORTCUTS = [
    { keys: ["Enter"], desc: t("shortcut.newBlock") },
    { keys: ["Backspace"], desc: t("shortcut.deleteBlock") },
    { keys: ["Tab"], desc: t("shortcut.indent") },
    { keys: ["Shift", "Tab"], desc: t("shortcut.outdent") },
    { keys: ["\u2191"], desc: t("shortcut.prevBlock") },
    { keys: ["\u2193"], desc: t("shortcut.nextBlock") },
    { keys: ["/"], desc: t("shortcut.slashMenu") },
  ];

  const SLASH_COMMANDS = [
    { command: "/p", desc: t("block.text") },
    { command: "/h", desc: t("block.heading") },
    { command: "/b", desc: t("block.bullet") },
    { command: "/n", desc: t("block.numbered") },
    { command: "/t", desc: t("block.todo") },
    { command: "/d", desc: t("block.divider") },
    { command: "/q", desc: t("block.quote") },
    { command: "/c", desc: t("block.code") },
  ];

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Password Change State ──────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // ── Recovery Key State ─────────────────────────────────────
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryCopied, setRecoveryCopied] = useState(false);

  // ── Lock Timeout ─────────────────────────────────────────
  const handleTimeoutChange = useCallback(
    async (value: string) => {
      const minutes = parseInt(value, 10);
      await setLockTimeout(minutes);
      toast.success(
        minutes === 0
          ? t("timeout.off")
          : `${minutes}${t("timeout.set")}`
      );
    },
    [setLockTimeout, t]
  );

  // ── Password Change ────────────────────────────────────────
  const handleChangePassword = useCallback(async () => {
    if (!currentPw) {
      toast.error(t("settings.currentPassword"));
      return;
    }
    if (newPw.length < 4) {
      toast.error(t("lock.errNewMinLength"));
      return;
    }
    if (newPw !== confirmPw) {
      toast.error(t("lock.errNewMismatch"));
      return;
    }
    setChangingPw(true);
    try {
      const ok = await changePassword(currentPw, newPw);
      if (ok) {
        toast.success(t("settings.passwordChanged"));
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        toast.error(t("settings.passwordWrong"));
      }
    } catch {
      toast.error(t("settings.passwordError"));
    } finally {
      setChangingPw(false);
    }
  }, [currentPw, newPw, confirmPw, changePassword, t]);

  // ── Recovery Key ───────────────────────────────────────────
  const handleShowRecoveryKey = useCallback(async () => {
    if (recoveryKey) {
      setRecoveryKey(null);
      return;
    }
    setRecoveryLoading(true);
    try {
      const key = await getRecoveryKey();
      if (key) {
        setRecoveryKey(key);
      } else {
        toast.error(t("settings.recoveryError"));
      }
    } catch {
      toast.error(t("settings.recoveryError"));
    } finally {
      setRecoveryLoading(false);
    }
  }, [recoveryKey, getRecoveryKey, t]);

  const handleCopyRecoveryKey = useCallback(async () => {
    if (!recoveryKey) return;
    await navigator.clipboard.writeText(recoveryKey);
    setRecoveryCopied(true);
    toast.success(t("settings.recoveryCopied"));
    setTimeout(() => setRecoveryCopied(false), 2000);
  }, [recoveryKey, t]);

  // ── Export ───────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const [categories, notes, blocks] = await Promise.all([
        db.categories.filter((c) => !c.deletedAt).toArray(),
        db.notes.filter((n) => !n.deletedAt).toArray(),
        db.blocks.filter((b) => !b.deletedAt).toArray(),
      ]);

      const decryptedCategories = await Promise.all(
        categories.map(async (cat) => ({
          ...cat,
          name: await decryptText(cat.name),
        }))
      );

      const decryptedNotes = await Promise.all(
        notes.map(async (note) => ({
          ...note,
          title: await decryptText(note.title),
        }))
      );

      const decryptedBlocks = await Promise.all(
        blocks.map(async (block) => ({
          ...block,
          content: block.content ? await decryptText(block.content) : "",
        }))
      );

      const exportData: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        categories: decryptedCategories,
        notes: decryptedNotes,
        blocks: decryptedBlocks,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `basic-note-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(t("settings.exported"));
    } catch (e) {
      console.error("[export]", e);
      toast.error(t("settings.exportError"));
    } finally {
      setExporting(false);
    }
  }, [decryptText, t]);

  // ── Import ──────────────────────────────────────────────
  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      setImporting(true);
      try {
        const text = await file.text();
        const data: ExportData = JSON.parse(text);

        if (data.version !== 1) {
          toast.error(t("settings.importBadFormat"));
          return;
        }

        const now = Date.now();

        for (const cat of data.categories) {
          const encrypted: Category = {
            ...cat,
            name: await encryptText(cat.name),
            updatedAt: now,
          };
          await db.categories.put(encrypted);
        }

        for (const note of data.notes) {
          const encrypted: Note = {
            ...note,
            title: await encryptText(note.title),
            updatedAt: now,
          };
          await db.notes.put(encrypted);
        }

        for (const block of data.blocks) {
          const encrypted: Block = {
            ...block,
            content: await encryptText(block.content),
            updatedAt: now,
          };
          await db.blocks.put(encrypted);
        }

        toast.success(
          `${t("settings.importCompleteNotes")}${data.notes.length}${t("settings.importCompleteCategories")}${data.categories.length}${t("settings.importCompleteUnit")}`
        );
      } catch (err) {
        console.error("[import]", err);
        toast.error(t("settings.importError"));
      } finally {
        setImporting(false);
      }
    },
    [encryptText, t]
  );

  return (
    <div className="grid gap-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>

      {/* ── Security ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            {t("settings.security")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Auto Lock */}
          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">{t("settings.autoLock")}</p>
              <p className="text-sm text-muted-foreground">
                {t("settings.autoLockDesc")}
              </p>
            </div>
            <Select
              value={String(lockTimeoutMinutes)}
              onValueChange={handleTimeoutChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEOUT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Password Change */}
          <div className="grid gap-4">
            <div className="grid gap-1">
              <p className="text-sm font-medium">{t("settings.changePassword")}</p>
              <p className="text-sm text-muted-foreground">
                {t("settings.changePasswordDesc")}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder={t("settings.currentPassword")}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Input
                type={showPw ? "text" : "password"}
                placeholder={t("settings.newPassword")}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="off"
              />
              <Input
                type={showPw ? "text" : "password"}
                placeholder={t("settings.confirmPassword")}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="off"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleChangePassword}
                disabled={changingPw}
              >
                {changingPw ? t("settings.changingPassword") : t("settings.changePasswordButton")}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Recovery Key */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="grid gap-1">
                <p className="text-sm font-medium">{t("settings.recoveryKey")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.recoveryKeyDesc")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowRecoveryKey}
                disabled={recoveryLoading}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                {recoveryKey ? t("settings.recoveryHide") : recoveryLoading ? t("settings.recoveryLoading") : t("settings.recoveryShow")}
              </Button>
            </div>

            {recoveryKey && (
              <div className="flex items-center gap-2 rounded-xl bg-muted p-4">
                <code className="flex-1 break-all text-sm font-mono select-all">
                  {recoveryKey}
                </code>
                <Button variant="ghost" size="xs" onClick={handleCopyRecoveryKey}>
                  {recoveryCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">{t("settings.language")}</p>
              <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
            </div>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Lock Now */}
          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">{t("settings.lockNow")}</p>
              <p className="text-sm text-muted-foreground">
                {t("settings.lockNowDesc")}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={lock}>
              <Shield className="h-4 w-4 mr-2" />
              {t("settings.lockButton")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Data ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            {t("settings.data")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">{t("settings.export")}</p>
              <p className="text-sm text-muted-foreground">
                {t("settings.exportDesc")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? t("settings.exporting") : t("settings.export")}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">{t("settings.import")}</p>
              <p className="text-sm text-muted-foreground">
                {t("settings.importDesc")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? t("settings.importing") : t("settings.import")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Keyboard Shortcuts ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Keyboard className="h-4 w-4" />
            {t("settings.shortcuts")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3">
            <p className="text-sm font-medium text-muted-foreground">{t("settings.editor")}</p>
            {SHORTCUTS.map(({ keys, desc }) => (
              <div
                key={desc}
                className="flex items-center justify-between text-sm"
              >
                <span>{desc}</span>
                <div className="flex items-center gap-1">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="grid gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {t("settings.slashCommands")}
            </p>
            {SLASH_COMMANDS.map(({ command, desc }) => (
              <div
                key={command}
                className="flex items-center justify-between text-sm"
              >
                <span>{desc}</span>
                <Kbd>{command}</Kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Info ──────────────────────────────────────── */}
      <div className="text-center text-xs text-muted-foreground pb-6">
        {t("settings.footer")}
      </div>
    </div>
  );
}
