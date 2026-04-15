"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useCrypto } from "@/components/providers/crypto-provider";
import { useNotes } from "@/hooks/use-notes";
import { BlockEditor } from "@/components/editor/block-editor";
import { NoteTitle } from "@/components/editor/note-title";
import { Button } from "@minnjii/dx-kit/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@minnjii/dx-kit/ui/popover";
import { Calendar } from "@minnjii/dx-kit/ui/calendar";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@minnjii/dx-kit/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@minnjii/dx-kit/ui/alert-dialog";
import { useCategories } from "@/hooks/use-categories";
import { ArrowLeft, MoreHorizontal, Trash2, Pin, PinOff, FolderInput, Folder, Inbox, Check, CalendarIcon } from "lucide-react";

export default function NoteEditorPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = use(params);
  const router = useRouter();
  const { decryptText } = useCrypto();
  const { updateNoteTitle, updateNoteDate, deleteNote, togglePin, moveToCategory } = useNotes();
  const { categories } = useCategories();

  const [title, setTitle] = useState("");
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const note = useLiveQuery(() => db.notes.get(noteId), [noteId]);

  // Decrypt title
  useEffect(() => {
    if (!note) return;
    decryptText(note.title).then(setTitle).catch(() => setTitle("(복호화 실패)"));
  }, [note, decryptText]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(() => {
        updateNoteTitle(noteId, newTitle);
      }, 500);
    },
    [noteId, updateNoteTitle]
  );

  const handleDelete = useCallback(async () => {
    await deleteNote(noteId);
    toast.success("노트를 삭제했습니다");
    router.push("/notes");
  }, [noteId, deleteNote, router]);

  if (!note) {
    return (
      <div className="text-muted-foreground text-sm py-8">로딩 중...</div>
    );
  }

  return (
    <div className="max-w-3xl grid gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/notes")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          뒤로
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              togglePin(noteId);
              toast.success(note.pinned ? "고정을 해제했습니다" : "노트를 고정했습니다");
            }}>
              {note.pinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  고정 해제
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  고정
                </>
              )}
            </DropdownMenuItem>
            {categories.length > 0 && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="mr-2 h-4 w-4" />
                    카테고리
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => {
                        moveToCategory(noteId, null);
                        toast.success("미분류로 이동했습니다");
                      }}
                      disabled={!note.categoryId}
                    >
                      <Inbox className="mr-2 h-4 w-4" />
                      미분류
                      {!note.categoryId && (
                        <Check className="ml-auto h-3.5 w-3.5" />
                      )}
                    </DropdownMenuItem>
                    {categories.map((cat) => (
                      <DropdownMenuItem
                        key={cat.id}
                        onClick={() => {
                          moveToCategory(noteId, cat.id);
                          toast.success(`"${cat.name}"으로 이동했습니다`);
                        }}
                        disabled={note.categoryId === cat.id}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        {cat.name}
                        {note.categoryId === cat.id && (
                          <Check className="ml-auto h-3.5 w-3.5" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>노트 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 노트를 삭제하시겠습니까?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title + Date */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <NoteTitle
            title={title}
            onTitleChange={handleTitleChange}
            onEnter={() => {
              const all = document.querySelectorAll<HTMLElement>(
                "[contenteditable]"
              );
              if (all.length > 1) all[1].focus();
            }}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground mt-1.5"
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {format(note.createdAt, "M월 d일", { locale: ko })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={new Date(note.createdAt)}
              onSelect={(date) => {
                if (date) updateNoteDate(noteId, date.getTime());
              }}
              locale={ko}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Block Editor */}
      <BlockEditor noteId={noteId} />
    </div>
  );
}
