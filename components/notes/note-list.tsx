"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@minnjii/dx-kit/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@minnjii/dx-kit/ui/alert-dialog";
import { Plus, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNotes } from "@/hooks/use-notes";
import { useCategories } from "@/hooks/use-categories";
import { NoteListItem } from "./note-list-item";

interface NoteListProps {
  categoryId?: string | null;
  title?: string;
}

export function NoteList({
  categoryId,
  title = "모든 노트",
}: NoteListProps) {
  const { notes, createNote, moveToCategory } = useNotes(categoryId);
  const { categories, deleteCategoryWithNotes } = useCategories();
  const router = useRouter();
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);

  const handleCreate = async () => {
    const noteId = await createNote(categoryId ?? null);
    if (noteId) router.push(`/notes/${noteId}`);
  };

  const handleFirstConfirm = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryId) return;
    await deleteCategoryWithNotes(categoryId);
    toast.success("카테고리와 노트가 삭제되었습니다");
    setShowSecondConfirm(false);
    router.push("/notes");
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {categoryId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFirstConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            새 노트
          </Button>
        </div>
      </div>

      <AlertDialog open={showFirstConfirm} onOpenChange={setShowFirstConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{title}&quot; 카테고리를 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirm}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSecondConfirm} onOpenChange={setShowSecondConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              해당 카테고리와 하위 모든 노트({notes.length}개)가 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">노트가 없습니다</h3>
        </div>
      ) : (
        <div className="grid gap-3">
          {notes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              categories={categories}
              onMoveToCategory={moveToCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
