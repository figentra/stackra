/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/code` (Code, inline code).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Code entry of the component registry. */
export const FREE_CODE: ComponentEntry = {
  slug: "code",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Code",
  parts: ["Code"],
  // HeroUI's Typography has no inline code style.
  hero: {},
  examples: [{ id: "inline", card: true }, { id: "arabic" }],
  related: ["free/typography", "free/code-block", "free/copy-button"],
  tokens: ["color.default"],
  keywords: ["code", "inline code", "monospace", "command", "kbd"],
  status: "new",
};
