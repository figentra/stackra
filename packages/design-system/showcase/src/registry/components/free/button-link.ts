/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/button-link` (ButtonLink).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the landing's core pill).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The ButtonLink entry of the component registry. */
export const FREE_BUTTON_LINK: ComponentEntry = {
  slug: "button-link",
  tier: "free",
  category: "navigation",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "ButtonLink",
  parts: ["ButtonLink"],
  // HeroUI has no link-as-button component; it is React Aria's Link drawn with HeroUI's buttonVariants.
  hero: {},
  examples: [{ id: "variants", card: true }, { id: "core-pill" }],
  related: ["free/button", "free/link"],
  tokens: ["color.accent", "color.core", "radius.field"],
  keywords: ["link", "button", "cta", "call to action", "href", "navigate", "pill"],
  status: "new",
};
