/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/date-field` (Date field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Date field. */
export const FREE_DATE_FIELD: ComponentEntry = {
  slug: "date-field",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DateField",
  parts: ["DateField"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "date-field",
      docsUrl: "https://www.heroui.com/docs/react/components/date-field",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/date-field",
      racUrl: "https://react-spectrum.adobe.com/react-aria/DateField.html",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "bounded" },
    { id: "states" },
    { id: "live" },
    { id: "unavailable", platforms: ["native"] },
  ],
  related: ["free/date-picker"],
  tokens: ["color.accent", "radius.field", "color.surface"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["date input", "day", "month", "year"],
};
