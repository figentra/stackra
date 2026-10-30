/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/slide-to-confirm` (Slide to confirm).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Slide to confirm. */
export const FREE_SLIDE_TO_CONFIRM: ComponentEntry = {
  slug: "slide-to-confirm",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SlideToConfirm",
  parts: ["SlideToConfirm"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/button", "free/alert-dialog"],
  tokens: ["color.accent", "color.danger", "radius.full"],
  haptics: [{ event: "confirm", style: "success" }],
  keywords: ["slide", "swipe to confirm", "unlock", "charge"],
  status: "new",
};
