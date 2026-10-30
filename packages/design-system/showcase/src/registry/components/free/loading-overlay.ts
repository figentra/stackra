/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/loading-overlay` (Loading overlay).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Loading overlay entry of the component registry. */
export const FREE_LOADING_OVERLAY: ComponentEntry = {
  slug: "loading-overlay",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "LoadingOverlay",
  parts: ["LoadingOverlay"],
  hero: {},
  examples: [
    { id: "saving", card: true },
    { id: "default" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/spinner", "free/page-skeleton", "free/inline-loading"],
  tokens: ["color.background", "color.accent"],
  keywords: ["loading overlay", "busy", "saving", "blocking", "spinner", "wait"],
  status: "new",
};
