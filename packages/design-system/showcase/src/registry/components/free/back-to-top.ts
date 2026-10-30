/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/back-to-top` (BackToTop).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Back to top. */
export const FREE_BACK_TO_TOP: ComponentEntry = {
  slug: "back-to-top",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "BackToTop",
  parts: ["BackToTop"],
  // An IconButton that shows past a scroll threshold.
  hero: {},
  examples: [
    { id: "container", card: true, platforms: ["react"] },
    { id: "window", platforms: ["react"] },
    { id: "scroll-view", platforms: ["native"] },
  ],
  related: ["free/fab", "free/icon-button", "free/scroll-area"],
  tokens: ["shadow.overlay", "color.focus"],
  keywords: ["back to top", "scroll to top", "jump", "floating button"],
  status: "new",
};
