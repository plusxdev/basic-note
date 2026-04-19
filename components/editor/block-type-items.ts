import {
  Type,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  Quote,
  Code,
} from "lucide-react";
import type { BlockType } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

export const BLOCK_ICON_MAP: Record<BlockType, React.ElementType> = {
  text: Type,
  heading: Heading,
  bullet: List,
  numbered: ListOrdered,
  todo: CheckSquare,
  divider: Minus,
  quote: Quote,
  code: Code,
};

export const BLOCK_ITEMS: {
  type: BlockType;
  labelKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  { type: "text", labelKey: "block.text", descKey: "block.textDesc" },
  { type: "heading", labelKey: "block.heading", descKey: "block.headingDesc" },
  { type: "bullet", labelKey: "block.bullet", descKey: "block.bulletDesc" },
  { type: "numbered", labelKey: "block.numbered", descKey: "block.numberedDesc" },
  { type: "todo", labelKey: "block.todo", descKey: "block.todoDesc" },
  { type: "divider", labelKey: "block.divider", descKey: "block.dividerDesc" },
  { type: "quote", labelKey: "block.quote", descKey: "block.quoteDesc" },
  { type: "code", labelKey: "block.code", descKey: "block.codeDesc" },
];
