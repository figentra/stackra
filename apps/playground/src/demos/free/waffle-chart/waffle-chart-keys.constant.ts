/**
 * Stackra file contract:
 * Purpose: `WAFFLE_CHART_KEYS`, the typed keys of the web WaffleChart demos' words in
 *          `assets/lang/<locale>/waffle_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The waffle_chart namespace's keys. */
export const WAFFLE_CHART_KEYS = keys({
  waffle_chart: [
    "payments_title",
    "payments_description",
    "card",
    "cod",
    "wallet",
    "later",
    "status_title",
    "status_description",
    "delivered",
    "shipped",
    "processing",
    "cancelled",
  ],
});
