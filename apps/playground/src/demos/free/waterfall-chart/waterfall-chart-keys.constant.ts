/**
 * Stackra file contract:
 * Purpose: `WATERFALL_CHART_KEYS`, the typed keys of the web Waterfall chart demos' words in `assets/lang/<locale>/waterfall_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The waterfall_chart namespace's keys. */
export const WATERFALL_CHART_KEYS = keys({
  waterfall_chart: [
    "bridge_title",
    "bridge_description",
    "label",
    "start",
    "end",
    "new_customers",
    "upsell",
    "churn",
    "refunds",
    "costs",
  ],
});
