/**
 * Stackra file contract:
 * Purpose: `SCATTER_CHART_KEYS`, the typed keys of the web Scatter chart demos' words in `assets/lang/<locale>/scatter_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The scatter_chart namespace's keys. */
export const SCATTER_CHART_KEYS = keys({
  scatter_chart: [
    "bubbles_title",
    "bubbles_description",
    "points_title",
    "points_description",
    "price",
    "units",
    "revenue",
    "drinks",
    "food",
    "minutes",
    "rating",
    "orders",
    "target",
  ],
});
