/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/date-picker` (Date picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Date picker entry of the component registry. */
export const FREE_DATE_PICKER: ComponentEntry = {
  slug: "date-picker",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DatePicker",
  parts: ["DatePicker"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "date-picker",
      docsUrl: "https://www.heroui.com/docs/react/components/date-picker",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/date-picker",
      racUrl: "https://react-spectrum.adobe.com/react-aria/DatePicker.html",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "bounded" },
    { id: "states" },
    { id: "live" },
    { id: "unavailable", platforms: ["native"] },
    { id: "controlled", platforms: ["native"] },
    { id: "hijri" },
    { id: "presets" },
  ],
  related: ["free/date-field"],
  tokens: ["color.accent", "radius.field", "color.surface"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["calendar", "date", "picker"],
};
