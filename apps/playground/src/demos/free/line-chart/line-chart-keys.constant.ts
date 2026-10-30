/**
 * Stackra file contract:
 * Purpose: `LINE_CHART_KEYS`, the typed keys of the web Line chart demos' words in `assets/lang/<locale>/line_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The line_chart namespace's keys. */
export const LINE_CHART_KEYS = keys({
  line_chart: [
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
    "dots_title",
    "linear_title",
    "month",
    "target",
    "previous",
  ],
});
