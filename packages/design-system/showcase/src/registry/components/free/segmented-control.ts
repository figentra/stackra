/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/segmented-control` (Segmented control).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Segmented control entry of the component registry. */
export const FREE_SEGMENTED_CONTROL: ComponentEntry = {
  slug: "segmented-control",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SegmentedControl",
  parts: ["SegmentedControl"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/tabs", "free/radio-group", "free/toggle-button"],
  tokens: ["color.surface", "radius.full", "motion.duration"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["segmented", "toggle group", "switcher", "range"],
  status: "new",
};
