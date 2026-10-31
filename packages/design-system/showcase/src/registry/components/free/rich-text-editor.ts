/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/rich-text-editor` (RichTextEditor).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0466; STA-1371.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The RichTextEditor entry of the component registry. */
export const FREE_RICH_TEXT_EDITOR: ComponentEntry = {
  slug: "rich-text-editor",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RichTextEditor",
  parts: ["RichTextEditor"],
  hero: {},
  examples: [
    { id: "basic", card: true },
    { id: "controlled" },
    { id: "read-only" },
    { id: "arabic" },
    { id: "contributions", platforms: ["react"] },
  ],
  related: ["free/text-area", "free/mention-input", "free/code-block"],
  tokens: ["color.field", "color.separator", "color.link"],
  keywords: ["rich text", "editor", "wysiwyg", "tiptap", "document", "formatting", "description"],
  status: "new",
};
