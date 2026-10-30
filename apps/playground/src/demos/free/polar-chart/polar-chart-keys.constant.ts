/**
 * Stackra file contract:
 * Purpose: `POLAR_CHART_KEYS`, the typed keys of the web PolarChart demos' words in
 *          `assets/lang/<locale>/polar_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The polar_chart namespace's keys. */
export const POLAR_CHART_KEYS = keys({
  polar_chart: [
    "orders_title",
    "orders_description",
    "orders",
    "orders_footer",
    "store_title",
    "store_description",
    "branch",
    "online",
    "returns_title",
    "returns_description",
    "returns",
  ],
});
