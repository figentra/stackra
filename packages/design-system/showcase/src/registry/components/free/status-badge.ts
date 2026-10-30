/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/status-badge` (Status badge).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Status badge. */
export const FREE_STATUS_BADGE: ComponentEntry = {
  slug: "status-badge",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "StatusBadge",
  parts: ["StatusBadge"],
  hero: {},
  examples: [
    { id: "tones", card: true },
    { id: "table", platforms: ["react"] },
    { id: "live" },
    { id: "records", platforms: ["native"] },
  ],
  related: ["free/spinner", "free/toast", "free/skeleton"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["status", "state", "label"],
};
