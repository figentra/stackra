/**
 * Stackra file contract:
 * Purpose: `CHART_LEGEND_KEYS`, the typed keys of the web Chart legend demos' words in `assets/lang/<locale>/chart_legend.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The chart_legend namespace's keys. */
export const CHART_LEGEND_KEYS = keys({
  chart_legend: ["online", "in_store", "phone", "hidden"],
});
