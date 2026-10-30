/**
 * Stackra file contract:
 * Purpose: `SUNBURST_CHART_KEYS`, the typed keys of the web Sunburst chart demos' words in `assets/lang/<locale>/sunburst_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The sunburst_chart namespace's keys. */
export const SUNBURST_CHART_KEYS = keys({
  sunburst_chart: [
    "label",
    "revenue",
    "drinks",
    "coffee",
    "tea",
    "juice",
    "food",
    "bakery",
    "sandwiches",
    "retail",
    "beans",
    "merch",
  ],
});
