"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@minnjii/dx-kit/ui/card";
import { Badge } from "@minnjii/dx-kit/ui/badge";
import { Button } from "@minnjii/dx-kit/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@minnjii/dx-kit/ui/dropdown-menu";
import { Pin, FolderInput, Folder, Inbox, Check } from "lucide-react";
import type { DecryptedNote } from "@/hooks/use-notes";
import type { Category } from "@/lib/types";

interface NoteListItemProps {
  note: DecryptedNote;
  categories?: Category[];
  onMoveToCategory?: (noteId: string, categoryId: string | null) => void;
}

export function NoteListItem({
  note,
  categories,
  onMoveToCategory,
}: NoteListItemProps) {
  const router = useRouter();
  const timeAgo = formatDistanceToNow(note.updatedAt, {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Card
      className="transition-colors hover:bg-accent/50 cursor-pointer"
      onClick={() => router.push(`/notes/${note.id}`)}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          {note.pinned && (
            <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
          )}
          <CardTitle className="text-base truncate">
            {note.decryptedTitle || "제목 없음"}
          </CardTitle>
        </div>
        <CardDescription className="line-clamp-1">
          {note.preview || "내용 없음"}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-xs shrink-0">
              {timeAgo}
            </Badge>
            {onMoveToCategory && categories && categories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderInput className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuLabel>카테고리 이동</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onMoveToCategory(note.id, null)}
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
                      onClick={() => onMoveToCategory(note.id, cat.id)}
                      disabled={note.categoryId === cat.id}
                    >
                      <Folder className="mr-2 h-4 w-4" />
                      {cat.name}
                      {note.categoryId === cat.id && (
                        <Check className="ml-auto h-3.5 w-3.5" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
