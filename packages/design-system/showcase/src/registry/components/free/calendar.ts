/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/calendar` (Calendar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Calendar. */
export const FREE_CALENDAR: ComponentEntry = {
  slug: "calendar",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Calendar",
  parts: ["Calendar"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "calendar",
      docsUrl: "https://www.heroui.com/docs/react/components/calendar",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/calendar",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "hijri" }, { id: "arabic", platforms: ["react"] }],
  related: ["free/date-picker", "free/range-calendar", "free/date-range-picker"],
  tokens: ["color.accent", "color.accent-soft", "radius.control"],
  keywords: ["calendar", "date", "day", "month", "hijri", "inline", "booking"],
  status: "new",
};
