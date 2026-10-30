/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/time-field` (Time field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Time field entry of the component registry. */
export const FREE_TIME_FIELD: ComponentEntry = {
  slug: "time-field",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TimeField",
  parts: ["TimeField"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "time-field",
      docsUrl: "https://www.heroui.com/docs/react/components/time-field",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/time-field",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "states" }],
  related: ["free/time-picker", "free/date-field"],
  tokens: ["radius.field", "color.field"],
  keywords: ["time", "hour", "minute", "clock"],
  status: "new",
};
