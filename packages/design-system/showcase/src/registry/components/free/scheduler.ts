/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/scheduler` (Scheduler).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Scheduler entry of the component registry. */
export const FREE_SCHEDULER: ComponentEntry = {
  slug: "scheduler",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Scheduler",
  parts: ["Scheduler"],
  hero: {},
  examples: [
    { id: "week", card: true },
    { id: "month" },
    { id: "agenda" },
    { id: "rtl", platforms: ["react"] },
  ],
  related: ["free/calendar", "free/recurrence-editor", "free/timeline-chart"],
  tokens: ["color.accent", "color.danger", "color.separator", "radius.container"],
  keywords: ["scheduler", "event calendar", "agenda", "bookings", "appointments", "week view"],
  status: "new",
};
