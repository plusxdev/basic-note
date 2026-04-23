import { db } from "@/lib/db";
import { syncPushEntity } from "@/lib/sync/engine";
import { looksLikeCiphertext } from "@/lib/crypto";

const BLOCKS_MIGRATED_KEY = "bn_blocks_migrated_v1";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Convert legacy plaintext (with optional "• " bullet prefixes) to HTML. */
export function plaintextToHtml(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  const parts: string[] = [];
  let inList = false;
  const flushList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };
  for (const line of lines) {
    const bulletMatch = line.match(/^ *• (.*)$/);
    if (bulletMatch) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      parts.push(`<li>${escapeHtml(bulletMatch[1])}</li>`);
    } else {
      flushList();
      parts.push(`<div>${line ? escapeHtml(line) : "<br>"}</div>`);
    }
  }
  flushList();
  return parts.join("");
}

/** Rebuild a single note's HTML from its legacy blocks. Empty string when no
 *  usable blocks exist. */
export async function migrateNoteFromBlocks(
  noteId: string,
  decrypt: (s: string) => Promise<string>
): Promise<string> {
  const blocks = await db.blocks
    .where("[noteId+sortOrder]")
    .between([noteId, ""], [noteId, "￿"])
    .toArray();
  const active = blocks.filter((b) => !b.deletedAt);
  const parts: string[] = [];
  let inList = false;
  const flushList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };
  for (const block of active) {
    let text = "";
    if (block.content) {
      try {
        text = await decrypt(block.content);
        if (looksLikeCiphertext(text)) text = "";
      } catch {
        text = "";
      }
    }
    const esc = escapeHtml(text);
    switch (block.type) {
      case "bullet":
      case "todo":
      case "numbered":
        if (!inList) {
          parts.push("<ul>");
          inList = true;
        }
        parts.push(`<li>${esc || "<br>"}</li>`);
        break;
      case "heading": {
        flushList();
        const level = block.meta?.level ?? 1;
        parts.push(`<h${level}>${esc}</h${level}>`);
        break;
      }
      case "divider":
        flushList();
        parts.push("<hr>");
        break;
      case "text":
      default:
        flushList();
        parts.push(`<div>${esc || "<br>"}</div>`);
        break;
    }
  }
  flushList();
  return parts.join("");
}

let isRunning = false;

/** One-shot sweep: for every note without `content`, rebuild HTML from its
 *  legacy blocks and encrypt it into note.content. Idempotent — a localStorage
 *  flag prevents re-runs once all notes finish cleanly. If any note fails the
 *  flag is left unset so a later unlock retries. */
export async function migrateAllNotesToContent(
  encrypt: (s: string) => Promise<string>,
  decrypt: (s: string) => Promise<string>
): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(BLOCKS_MIGRATED_KEY)) return;
  if (isRunning) return;
  isRunning = true;

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const notes = await db.notes.toArray();
    for (const note of notes) {
      if (note.deletedAt) {
        skipped++;
        continue;
      }
      if (note.content) {
        skipped++;
        continue;
      }
      try {
        const html = await migrateNoteFromBlocks(note.id, decrypt);
        if (!html) {
          skipped++;
          continue;
        }
        const encrypted = await encrypt(html);
        await db.notes.update(note.id, {
          content: encrypted,
          updatedAt: Date.now(),
        });
        const updated = await db.notes.get(note.id);
        if (updated) syncPushEntity("note", updated);
        migrated++;
      } catch (e) {
        console.error(`[migrate-blocks] note ${note.id} failed:`, e);
        failed++;
      }
    }

    if (failed === 0) {
      localStorage.setItem(BLOCKS_MIGRATED_KEY, String(Date.now()));
    }
    console.info(
      `[migrate-blocks] migrated=${migrated} skipped=${skipped} failed=${failed}`
    );
  } finally {
    isRunning = false;
  }
}
