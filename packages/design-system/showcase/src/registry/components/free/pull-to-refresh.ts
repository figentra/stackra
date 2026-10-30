/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/pull-to-refresh` (Pull to refresh).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Pull to refresh. */
export const FREE_PULL_TO_REFRESH: ComponentEntry = {
  slug: "pull-to-refresh",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["native"],
  packageName: "@stackra/ui",
  exportName: "PullToRefresh",
  parts: ["PullToRefresh"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/list", "free/spinner"],
  tokens: ["color.accent"],
  haptics: [{ event: "pull", style: "impact" }],
  keywords: ["refresh", "reload", "pull down"],
  status: "new",
};
