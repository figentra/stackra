/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/timeline` (Timeline).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Timeline entry of the component registry. */
export const FREE_TIMELINE: ComponentEntry = {
  slug: "timeline",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Timeline",
  parts: ["Timeline"],
  hero: {},
  examples: [
    { id: "order", card: true },
    { id: "compact" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/comment-thread", "free/notifications-panel", "free/list"],
  tokens: ["color.separator", "color.accent-soft", "color.success", "color.warning"],
  keywords: ["timeline", "activity", "feed", "history", "audit log", "events", "changelog"],
  status: "new",
};
