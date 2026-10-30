/**
 * Stackra file contract:
 * Purpose: `CANDLESTICK_CHART_KEYS`, the typed keys of the web Candlestick chart demos' words in `assets/lang/<locale>/candlestick_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The candlestick_chart namespace's keys. */
export const CANDLESTICK_CHART_KEYS = keys({
  candlestick_chart: ["prices_title", "prices_description", "label"],
});
