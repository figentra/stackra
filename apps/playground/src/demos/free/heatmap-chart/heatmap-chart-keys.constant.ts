/**
 * Stackra file contract:
 * Purpose: `HEATMAP_CHART_KEYS`, the typed keys of the web Heatmap chart demos' words in `assets/lang/<locale>/heatmap_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The heatmap_chart namespace's keys. */
export const HEATMAP_CHART_KEYS = keys({
  heatmap_chart: [
    "hours_title",
    "hours_description",
    "label",
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
  ],
});
