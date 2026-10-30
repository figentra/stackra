/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/error-state` (Error state).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Error state. */
export const FREE_ERROR_STATE: ComponentEntry = {
  slug: "error-state",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ErrorState",
  parts: ["ErrorState"],
  hero: {},
  examples: [
    { id: "kinds", card: true },
    { id: "parts", platforms: ["react"] },
    { id: "live" },
    { id: "details", platforms: ["native"] },
    { id: "retry", platforms: ["native"] },
    { id: "actions", platforms: ["native"] },
  ],
  related: ["free/environment-banner", "free/empty-state", "free/page-skeleton"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["error", "failure", "retry"],
};
