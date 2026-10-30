/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/empty-state` (Empty state).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Empty state entry of the component registry. */
export const FREE_EMPTY_STATE: ComponentEntry = {
  slug: "empty-state",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "EmptyState",
  parts: ["EmptyState"],
  hero: {},
  examples: [
    { id: "reasons", card: true },
    { id: "parts", platforms: ["react"] },
    { id: "live" },
    { id: "icons", platforms: ["native"] },
    { id: "actions", platforms: ["native"] },
  ],
  related: ["free/alert", "free/environment-banner", "free/error-state"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["empty", "no data", "placeholder"],
};
