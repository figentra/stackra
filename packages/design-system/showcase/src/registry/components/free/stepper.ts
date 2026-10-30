/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/stepper` (Stepper).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Stepper. */
export const FREE_STEPPER: ComponentEntry = {
  slug: "stepper",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Stepper",
  parts: ["Stepper"],
  hero: {},
  examples: [
    { id: "horizontal", card: true },
    { id: "vertical" },
    { id: "with-error" },
    { id: "compact" },
    { id: "drawer", platforms: ["react"] },
    { id: "rtl", platforms: ["react"] },
  ],
  related: ["free/drawer", "free/progress-bar", "free/tabs"],
  tokens: ["color.accent", "color.danger", "color.separator"],
  keywords: ["stepper", "steps", "wizard", "progress", "checkout", "onboarding", "multi-step"],
  status: "new",
};
