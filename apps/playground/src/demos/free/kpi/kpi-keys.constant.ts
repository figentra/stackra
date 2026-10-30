/**
 * Stackra file contract:
 * Purpose: `KPI_KEYS`, the typed keys of the web KPI demos' words in `assets/lang/<locale>/kpi.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The kpi namespace's keys. */
export const KPI_KEYS = keys({
  kpi: ["band", "revenue", "orders", "refunds", "basket", "vs_last", "customers", "opened"],
});
