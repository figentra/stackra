/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/date-label` (DateLabel).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The DateLabel entry of the component registry. */
export const FREE_DATE_LABEL: ComponentEntry = {
  slug: "date-label",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DateLabel",
  parts: ["DateLabel"],
  hero: {},
  examples: [{ id: "states", card: true }, { id: "invoices" }, { id: "hijri" }, { id: "live" }],
  related: ["free/chip", "free/date-picker", "free/status-badge"],
  tokens: ["color.danger", "color.warning", "radius.base", "motion.duration"],
  keywords: ["due", "overdue", "expiry", "relative time", "hijri"],
};
