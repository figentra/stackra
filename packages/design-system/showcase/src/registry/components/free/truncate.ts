/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/truncate` (Truncate).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Truncate entry of the component registry. */
export const FREE_TRUNCATE: ComponentEntry = {
  slug: "truncate",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Truncate",
  parts: ["Truncate"],
  hero: {},
  examples: [
    { id: "review", card: true },
    { id: "tooltip" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/tooltip", "free/accordion", "free/item-card"],
  tokens: ["color.accent-soft-foreground"],
  keywords: ["truncate", "line clamp", "show more", "read more", "spoiler", "ellipsis"],
  status: "new",
};
