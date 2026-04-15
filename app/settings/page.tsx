"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Upload,
  Lock,
  Keyboard,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@minnjii/dx-kit/ui/card";
import { Button } from "@minnjii/dx-kit/ui/button";
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
import { db } from "@/lib/db";
import type { Category, Note, Block } from "@/lib/types";

// ─── Lock Timeout Options ────────────────────────────────────
const TIMEOUT_OPTIONS = [
  { value: "1", label: "1분" },
  { value: "5", label: "5분" },
  { value: "15", label: "15분" },
  { value: "30", label: "30분" },
  { value: "0", label: "사용 안 함" },
];

// ─── Keyboard Shortcuts ──────────────────────────────────────
const SHORTCUTS = [
  { keys: ["Enter"], desc: "새 블록 추가" },
  { keys: ["Backspace"], desc: "빈 블록 삭제" },
  { keys: ["Tab"], desc: "들여쓰기" },
  { keys: ["Shift", "Tab"], desc: "내어쓰기" },
  { keys: ["↑"], desc: "이전 블록으로 이동" },
  { keys: ["↓"], desc: "다음 블록으로 이동" },
  { keys: ["/"], desc: "슬래시 명령 메뉴" },
];

const SLASH_COMMANDS = [
  { command: "/p", desc: "텍스트" },
  { command: "/h", desc: "제목" },
  { command: "/b", desc: "불릿 리스트" },
  { command: "/n", desc: "번호 리스트" },
  { command: "/t", desc: "할 일" },
  { command: "/d", desc: "구분선" },
  { command: "/q", desc: "인용" },
  { command: "/c", desc: "코드" },
];

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
  } = useCrypto();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Lock Timeout ─────────────────────────────────────────
  const handleTimeoutChange = useCallback(
    async (value: string) => {
      const minutes = parseInt(value, 10);
      await setLockTimeout(minutes);
      toast.success(
        minutes === 0
          ? "자동 잠금을 사용하지 않습니다"
          : `${minutes}분 후 자동 잠금됩니다`
      );
    },
    [setLockTimeout]
  );

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

      toast.success("데이터를 내보냈습니다");
    } catch (e) {
      console.error("[export]", e);
      toast.error("내보내기에 실패했습니다");
    } finally {
      setExporting(false);
    }
  }, [decryptText]);

  // ── Import ──────────────────────────────────────────────
  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input so same file can be selected again
      e.target.value = "";

      setImporting(true);
      try {
        const text = await file.text();
        const data: ExportData = JSON.parse(text);

        if (data.version !== 1) {
          toast.error("지원하지 않는 백업 형식입니다");
          return;
        }

        const now = Date.now();

        // Encrypt and store categories
        for (const cat of data.categories) {
          const encrypted: Category = {
            ...cat,
            name: await encryptText(cat.name),
            updatedAt: now,
          };
          await db.categories.put(encrypted);
        }

        // Encrypt and store notes
        for (const note of data.notes) {
          const encrypted: Note = {
            ...note,
            title: await encryptText(note.title),
            updatedAt: now,
          };
          await db.notes.put(encrypted);
        }

        // Encrypt and store blocks
        for (const block of data.blocks) {
          const encrypted: Block = {
            ...block,
            content: await encryptText(block.content),
            updatedAt: now,
          };
          await db.blocks.put(encrypted);
        }

        toast.success(
          `가져오기 완료: 노트 ${data.notes.length}개, 카테고리 ${data.categories.length}개`
        );
      } catch (err) {
        console.error("[import]", err);
        toast.error("가져오기에 실패했습니다. 파일을 확인해주세요.");
      } finally {
        setImporting(false);
      }
    },
    [encryptText]
  );

  return (
    <div className="grid gap-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">설정</h1>

      {/* ── Security ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            보안
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">자동 잠금</p>
              <p className="text-sm text-muted-foreground">
                비활동 시 자동으로 앱을 잠급니다
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

          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">지금 잠그기</p>
              <p className="text-sm text-muted-foreground">
                즉시 앱을 잠금 상태로 전환합니다
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={lock}>
              <Shield className="h-4 w-4 mr-2" />
              잠금
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Data ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            데이터
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">내보내기</p>
              <p className="text-sm text-muted-foreground">
                모든 노트와 카테고리를 JSON으로 저장합니다
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "내보내는 중…" : "내보내기"}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <p className="text-sm font-medium">가져오기</p>
              <p className="text-sm text-muted-foreground">
                백업 파일에서 데이터를 복원합니다
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "가져오는 중…" : "가져오기"}
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
            키보드 단축키
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3">
            <p className="text-sm font-medium text-muted-foreground">에디터</p>
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
              슬래시 명령
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
        basic note — AES-256-GCM 암호화
      </div>
    </div>
  );
}
