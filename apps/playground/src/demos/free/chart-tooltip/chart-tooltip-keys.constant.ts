/**
 * Stackra file contract:
 * Purpose: `CHART_TOOLTIP_KEYS`, the typed keys of the web Chart tooltip demos' words in `assets/lang/<locale>/chart_tooltip.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The chart_tooltip namespace's keys. */
export const CHART_TOOLTIP_KEYS = keys({
  chart_tooltip: ["online", "in_store", "revenue", "refunds", "march", "week"],
});
