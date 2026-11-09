/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/scheduling-board` (SchedulingBoard).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0302 (decision 3: one API on web and
 *                     native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The SchedulingBoard entry of the component registry. */
export const FREE_SCHEDULING_BOARD: ComponentEntry = {
  slug: "scheduling-board",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SchedulingBoard",
  parts: ["SchedulingBoard"],
  hero: {},
  examples: [
    { id: "day", card: true },
    { id: "week" },
    { id: "timeline" },
    { id: "rtl", platforms: ["react"] },
    { id: "read-only" },
    { id: "drag" },
  ],
  related: ["free/scheduler", "free/timeline-chart", "free/calendar"],
  tokens: ["color.accent", "color.warning", "color.danger", "color.separator", "radius.container"],
  keywords: [
    "scheduling board",
    "resource schedule",
    "bookings",
    "holds",
    "timeline",
    "rota",
    "drag and drop",
  ],
  status: "new",
};
