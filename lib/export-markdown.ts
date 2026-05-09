import type { Note } from "@/lib/types";

interface BuildArgs {
  notes: Array<Omit<Note, "title" | "content"> & { title: string; content: string }>;
  categoryNamesById: Record<string, string>;
}

const HEADING_PREFIX: Record<string, string> = {
  H1: "# ",
  H2: "## ",
  H3: "### ",
  H4: "#### ",
  H5: "##### ",
  H6: "###### ",
};

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName;
  const inner = childrenToMarkdown(el);

  switch (tag) {
    case "BR":
      return "  \n";
    case "B":
    case "STRONG":
      return inner.trim() ? `**${inner}**` : "";
    case "I":
    case "EM":
      return inner.trim() ? `*${inner}*` : "";
    case "U":
      return inner.trim() ? `<u>${inner}</u>` : "";
    case "MARK":
      return inner.trim() ? `==${inner}==` : "";
    case "A": {
      const href = el.getAttribute("href") ?? "";
      const text = inner.trim();
      if (!text) return "";
      if (!href) return text;
      return `[${text}](${href})`;
    }
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
      return `\n${HEADING_PREFIX[tag]}${inner.trim()}\n\n`;
    case "P":
    case "DIV":
      return `${inner}\n\n`;
    case "UL":
      return `${inner}\n`;
    case "OL":
      return `${inner}\n`;
    case "LI": {
      const parent = el.parentElement?.tagName;
      const marker = parent === "OL" ? "1. " : "- ";
      return `${marker}${inner.trim()}\n`;
    }
    case "BLOCKQUOTE":
      return `> ${inner.trim().replace(/\n/g, "\n> ")}\n\n`;
    case "CODE":
      return inner ? `\`${inner}\`` : "";
    case "PRE":
      return `\n\`\`\`\n${el.textContent ?? ""}\n\`\`\`\n\n`;
    case "HR":
      return "\n---\n\n";
    default:
      return inner;
  }
}

function childrenToMarkdown(el: HTMLElement): string {
  let out = "";
  el.childNodes.forEach((child) => {
    out += nodeToMarkdown(child);
  });
  return out;
}

export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return "";
  const md = childrenToMarkdown(root);
  return md.replace(/\n{3,}/g, "\n\n").trim();
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

export function buildBackupMarkdown({ notes, categoryNamesById }: BuildArgs): string {
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const header = `# basic note 백업\n\n*내보낸 시각*: ${new Date().toISOString()}  \n*노트 수*: ${notes.length}개\n\n---\n\n`;

  const body = sorted
    .map((note) => {
      const title = note.title.trim() || "(제목 없음)";
      const cat = note.categoryId
        ? (categoryNamesById[note.categoryId] ?? "(삭제된 카테고리)")
        : "미분류";
      const meta = `*카테고리*: ${cat} · *작성일*: ${formatDate(note.createdAt)} · *수정일*: ${formatDate(note.updatedAt)}${note.pinned ? " · 📌" : ""}`;
      const content = htmlToMarkdown(note.content) || "_(빈 노트)_";
      return `# ${title}\n\n${meta}\n\n${content}\n`;
    })
    .join("\n---\n\n");

  return header + body + "\n";
}
