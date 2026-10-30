/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/range-calendar` (Range calendar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Range calendar entry of the component registry. */
export const FREE_RANGE_CALENDAR: ComponentEntry = {
  slug: "range-calendar",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RangeCalendar",
  parts: ["RangeCalendar"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "range-calendar",
      docsUrl: "https://www.heroui.com/docs/react/components/range-calendar",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/range-calendar",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "hijri" }],
  related: ["free/date-range-picker"],
  tokens: ["color.accent", "color.accent-soft"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["calendar", "range", "dates", "hijri"],
  status: "new",
};
