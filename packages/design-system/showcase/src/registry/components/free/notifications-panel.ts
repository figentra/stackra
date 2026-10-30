/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/notifications-panel` (Notifications panel).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; gap inventory row 13 (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Notifications panel entry of the component registry. */
export const FREE_NOTIFICATIONS_PANEL: ComponentEntry = {
  slug: "notifications-panel",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NotificationsPanel",
  parts: ["NotificationsPanel"],
  hero: {},
  examples: [{ id: "inbox", card: true }, { id: "arrival" }, { id: "empty" }],
  related: ["free/badge", "free/popover", "free/drawer"],
  tokens: ["color.accent", "color.danger", "color.muted"],
  haptics: [{ event: "arrival", style: "success" }],
  keywords: ["inbox", "notifications", "bell"],
};
