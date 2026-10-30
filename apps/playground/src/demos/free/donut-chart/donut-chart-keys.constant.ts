/**
 * Stackra file contract:
 * Purpose: `DONUT_CHART_KEYS`, the typed keys of the web Donut chart demos' words in `assets/lang/<locale>/donut_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The donut_chart namespace's keys. */
export const DONUT_CHART_KEYS = keys({
  donut_chart: [
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
    "total_title",
    "plain_title",
  ],
});
