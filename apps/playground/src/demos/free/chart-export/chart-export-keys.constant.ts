/**
 * Stackra file contract:
 * Purpose: `CHART_EXPORT_KEYS`, the typed keys of the web Chart export demos' words in `assets/lang/<locale>/chart_export.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The chart_export namespace's keys. */
export const CHART_EXPORT_KEYS = keys({
  chart_export: ["label", "month", "sales", "jan", "feb", "mar", "apr", "may", "jun"],
});
