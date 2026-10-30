/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/floating-panel` (FloatingPanel).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The FloatingPanel entry of the component registry. */
export const FREE_FLOATING_PANEL: ComponentEntry = {
  slug: "floating-panel",
  tier: "free",
  category: "overlays",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "FloatingPanel",
  parts: ["FloatingPanel"],
  // HeroUI has no floating window; this one is the house's, on its IconButton.
  hero: {},
  examples: [
    { id: "basics", card: true, minHeight: 520 },
    { id: "tool-palette", minHeight: 520 },
  ],
  related: ["free/side-panel", "free/drawer", "free/popover"],
  tokens: ["color.overlay", "shadow.overlay", "radius.container"],
  keywords: ["floating panel", "window", "chat window", "tool palette", "draggable", "resizable"],
  status: "new",
};
