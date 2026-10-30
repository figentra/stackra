/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/period-picker` (Period picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (component wave B).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The PeriodPicker entry of the component registry. */
export const FREE_PERIOD_PICKER: ComponentEntry = {
  slug: "period-picker",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PeriodPicker",
  parts: ["PeriodPicker"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "compare" }, { id: "widget" }],
  related: ["free/date-range-picker", "free/widget-frame", "free/kpi"],
  tokens: ["radius.field", "color.overlay", "color.muted"],
  keywords: ["period", "date range", "presets", "compare", "previous period", "dashboard"],
  status: "new",
};
