/**
 * Stackra file contract:
 * Purpose: `BOX_PLOT_CHART_KEYS`, the typed keys of the web Box plot chart demos' words in `assets/lang/<locale>/box_plot_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The box_plot_chart namespace's keys. */
export const BOX_PLOT_CHART_KEYS = keys({
  box_plot_chart: [
    "delivery_title",
    "delivery_description",
    "riyadh",
    "jeddah",
    "dammam",
    "makkah",
  ],
});
