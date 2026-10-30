/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/date-range-picker` (Date range picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Date range picker. */
export const FREE_DATE_RANGE_PICKER: ComponentEntry = {
  slug: "date-range-picker",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DateRangePicker",
  parts: ["DateRangePicker"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "date-range-picker",
      docsUrl: "https://www.heroui.com/docs/react/components/date-range-picker",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/date-range-picker",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "hijri" }],
  related: ["free/range-calendar", "free/date-picker"],
  tokens: ["radius.field", "color.overlay"],
  keywords: ["date range", "presets", "period", "report"],
  status: "new",
};
