/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/account-connection` (Account connection).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory row 38.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Account connection. */
export const FREE_ACCOUNT_CONNECTION: ComponentEntry = {
  slug: "account-connection",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AccountConnection",
  parts: ["AccountConnection"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "connected" }, { id: "live" }],
  related: ["free/card", "free/status-badge", "free/button"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["integration", "connect", "oauth", "payments", "delivery"],
};
