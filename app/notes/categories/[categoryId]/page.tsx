"use client";

import { use } from "react";
import { useCategories } from "@/hooks/use-categories";
import { NoteList } from "@/components/notes/note-list";

export default function CategoryNotesPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = use(params);
  const { categories } = useCategories();

  const category = categories.find((c) => c.id === categoryId);
  const title = category ? category.name : "카테고리";

  return (
    <NoteList
      categoryId={categoryId}
      title={title}
    />
  );
}
