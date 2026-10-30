/**
 * Stackra file contract:
 * Purpose: `AREA_CHART_KEYS`, the typed keys of the web Area chart demos' words in `assets/lang/<locale>/area_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The area_chart namespace's keys. */
export const AREA_CHART_KEYS = keys({
  area_chart: [
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
    "interactive_title",
    "interactive_description",
    "range",
    "range_7",
    "range_30",
    "range_90",
    "stacked_title",
    "step_title",
    "axes_title",
    "revenue",
    "date",
    "previous",
    "percent_title",
  ],
});
