"use client";

import { useNotes, type DecryptedNote } from "@/hooks/use-notes";
import { useCategories } from "@/hooks/use-categories";
import { NoteListItem } from "./note-list-item";

/**
 * Thin wrapper that wires up the standard note actions (pin, delete, move)
 * from hooks so list callers don't have to plumb each one individually.
 * Use this anywhere a note needs to be rendered as a list card.
 */
export function NoteCard({ note }: { note: DecryptedNote }) {
  const { moveToCategory, togglePin, deleteNote } = useNotes();
  const { categories } = useCategories();
  return (
    <NoteListItem
      note={note}
      categories={categories}
      onMoveToCategory={moveToCategory}
      onTogglePin={togglePin}
      onDelete={deleteNote}
    />
  );
}
