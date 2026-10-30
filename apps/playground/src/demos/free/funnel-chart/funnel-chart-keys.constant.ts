/**
 * Stackra file contract:
 * Purpose: `FUNNEL_CHART_KEYS`, the typed keys of the web Funnel chart demos' words in `assets/lang/<locale>/funnel_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The funnel_chart namespace's keys. */
export const FUNNEL_CHART_KEYS = keys({
  funnel_chart: ["label", "visited", "viewed", "cart", "checkout", "paid"],
});
