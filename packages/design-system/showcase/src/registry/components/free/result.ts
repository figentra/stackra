/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/result` (Result).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Result entry of the component registry. */
export const FREE_RESULT: ComponentEntry = {
  slug: "result",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Result",
  parts: ["Result"],
  hero: {},
  examples: [{ id: "paid", card: true }, { id: "states" }, { id: "arabic", platforms: ["react"] }],
  related: ["free/empty-state", "free/error-state", "free/toast"],
  tokens: ["color.success", "color.danger", "color.accent-soft"],
  keywords: ["result", "success page", "outcome", "confirmation", "done", "failed", "pending"],
  status: "new",
};
