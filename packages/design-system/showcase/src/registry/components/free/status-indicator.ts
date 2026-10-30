/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/status-indicator` (Status indicator).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; gap inventory row 30 (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Status indicator. */
export const FREE_STATUS_INDICATOR: ComponentEntry = {
  slug: "status-indicator",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "StatusIndicator",
  parts: ["StatusIndicator"],
  hero: {},
  examples: [{ id: "tones", card: true }, { id: "kds" }, { id: "tables" }],
  related: ["free/status-badge", "free/badge", "free/chip"],
  tokens: ["color.success", "color.warning", "color.danger"],
  keywords: ["status", "shape", "colour blind", "kds"],
};
