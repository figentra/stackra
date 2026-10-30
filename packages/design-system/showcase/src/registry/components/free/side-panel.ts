/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/side-panel` (SidePanel).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; owner request 2026-10-29 (STA-1371).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The SidePanel entry of the component registry. */
export const FREE_SIDE_PANEL: ComponentEntry = {
  slug: "side-panel",
  tier: "free",
  category: "navigation",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "SidePanel",
  parts: [
    "SidePanel",
    "SidePanel.Inset",
    "SidePanel.Panel",
    "SidePanel.Header",
    "SidePanel.Body",
    "SidePanel.Footer",
    "SidePanel.Handle",
    "SidePanel.Launcher",
  ],
  hero: {},
  examples: [
    { id: "assistant", card: true },
    { id: "inspector" },
    { id: "split" },
    { id: "resizable" },
    { id: "expandable" },
    { id: "controlled" },
    { id: "arabic" },
  ],
  related: ["free/sidebar", "free/drawer", "free/app-shell"],
  tokens: ["color.surface", "radius.container", "motion.duration"],
  keywords: ["aside", "inspector", "assistant", "push", "resize", "split view"],
};
