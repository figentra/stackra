/**
 * Stackra file contract:
 * Purpose: `BAR_CHART_KEYS`, the typed keys of the web Bar chart demos' words in `assets/lang/<locale>/bar_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The bar_chart namespace's keys. */
export const BAR_CHART_KEYS = keys({
  bar_chart: [
    "desktop",
    "mobile",
    "visitors",
    "months_description",
    "trend",
    "chrome",
    "safari",
    "firefox",
    "edge",
    "other",
    "multiple_title",
    "stacked_title",
    "horizontal_title",
    "single_title",
    "month",
    "previous",
    "percent_title",
  ],
});
