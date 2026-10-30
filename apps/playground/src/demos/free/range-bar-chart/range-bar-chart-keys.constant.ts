/**
 * Stackra file contract:
 * Purpose: `RANGE_BAR_CHART_KEYS`, the typed keys of the web Range bar chart demos' words in `assets/lang/<locale>/range_bar_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The range_bar_chart namespace's keys. */
export const RANGE_BAR_CHART_KEYS = keys({
  range_bar_chart: [
    "temperature_title",
    "temperature_description",
    "prices_title",
    "prices_description",
    "starter",
    "growth",
    "business",
    "enterprise",
  ],
});
