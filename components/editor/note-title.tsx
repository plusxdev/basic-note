"use client";

import { useRef, useEffect, useCallback } from "react";

interface NoteTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
  onEnter: () => void;
}

export function NoteTitle({ title, onTitleChange, onEnter }: NoteTitleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (ref.current.textContent !== title) {
      ref.current.textContent = title;
    }
  }, [title]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      onTitleChange(ref.current.textContent ?? "");
    }
  }, [onTitleChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        // Always suppress default to prevent stray <br>/newline during IME composition.
        // Action only fires when composition is idle (the "real" Enter after commit).
        e.preventDefault();
        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
        onEnter();
      }
    },
    [onEnter]
  );

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className="outline-none text-3xl font-bold tracking-[-0.03em] text-foreground min-h-[1.2em]"
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-placeholder="제목 없음"
    />
  );
}
