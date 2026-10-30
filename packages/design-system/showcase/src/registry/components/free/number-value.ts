/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/number-value` (Number value).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Number value. */
export const FREE_NUMBER_VALUE: ComponentEntry = {
  slug: "number-value",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NumberValue",
  parts: ["NumberValue", "PercentValue", "BytesValue", "MoneyValue"],
  hero: {},
  examples: [
    { id: "summary", card: true },
    { id: "compact" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/number-ticker", "free/kpi", "free/money-field"],
  tokens: ["font.tabular"],
  keywords: [
    "number format",
    "percent",
    "bytes",
    "file size",
    "money",
    "currency",
    "digits",
    "arabic numerals",
  ],
  status: "new",
};
