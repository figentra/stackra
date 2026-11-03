/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/frame` (Frame).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, W4).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Frame entry of the component registry. */
export const FREE_FRAME: ComponentEntry = {
  slug: "frame",
  tier: "free",
  category: "layout",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Frame",
  parts: ["Frame"],
  // HeroUI has no device or window frame; this is the adapted form on theme tokens.
  hero: {},
  examples: [{ id: "window", card: true }, { id: "phone" }],
  related: ["free/dither-art", "free/bento-card", "free/segmented-control"],
  tokens: ["radius.lg", "color.surface", "color.border"],
  keywords: ["frame", "window", "phone", "mockup", "screenshot", "browser chrome", "device frame"],
  status: "new",
};
