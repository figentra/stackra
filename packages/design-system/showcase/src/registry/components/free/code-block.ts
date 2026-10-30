/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/code-block` (Code block).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Code block. */
export const FREE_CODE_BLOCK: ComponentEntry = {
  slug: "code-block",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CodeBlock",
  parts: ["CodeBlock", "JsonViewer", "MarkdownViewer"],
  hero: {},
  examples: [
    { id: "snippet", card: true },
    { id: "highlighted", platforms: ["react"] },
    { id: "diff", platforms: ["react"] },
    { id: "wrap", platforms: ["react"] },
    { id: "collapse", platforms: ["react"] },
    { id: "files", platforms: ["react"] },
    { id: "shell", platforms: ["react"] },
    { id: "rtl", platforms: ["react"] },
    { id: "json" },
    { id: "markdown" },
  ],
  related: ["free/copy-button", "free/property-list"],
  tokens: [
    "font.mono",
    "color.surface-secondary",
    "color.separator",
    "color.syntax-keyword",
    "color.syntax-string",
  ],
  keywords: [
    "code",
    "snippet",
    "json",
    "markdown",
    "payload",
    "viewer",
    "pre",
    "syntax",
    "highlight",
    "diff",
    "shell",
  ],
  status: "new",
};
