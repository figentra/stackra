/**
 * Stackra file contract:
 * Purpose: `COMPOSED_CHART_KEYS`, the typed keys of the web Composed chart demos' words in `assets/lang/<locale>/composed_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The composed_chart namespace's keys. */
export const COMPOSED_CHART_KEYS = keys({
  composed_chart: [
    "label",
    "revenue",
    "target",
    "dual_title",
    "dual_description",
    "visitors",
    "orders",
    "launch",
  ],
});
