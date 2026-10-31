/**
 * Stackra file contract:
 * Purpose: `PRICING_TABLE_KEYS`, the typed keys of the web pricing-table demo's words in `assets/lang/<locale>/pricing_table.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demo's keys. */
export const PRICING_TABLE_KEYS = keys({
  pricing_table: {
    basics: [
      "period",
      "monthly",
      "yearly",
      "per_month",
      "per_year",
      "starter",
      "starter_line",
      "growth",
      "growth_line",
      "scale",
      "scale_line",
      "one_shop",
      "products_500",
      "cod",
      "three_shops",
      "unlimited",
      "reports",
      "api",
      "support",
      "start",
      "choose",
      "talk",
      "popular",
      "chosen",
    ],
  },
});
