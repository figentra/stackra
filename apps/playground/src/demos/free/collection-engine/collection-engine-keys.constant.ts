/**
 * Stackra file contract:
 * Purpose: `COLLECTION_ENGINE_KEYS`, the typed keys of the collection engine page's demo words in
 *          `assets/lang/<locale>/collection_engine.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The collection_engine namespace's keys. */
export const COLLECTION_ENGINE_KEYS = keys({
  collection_engine: [
    "search",
    "sort_total",
    "sort_customer",
    "previous",
    "next",
    "page",
    "rows",
    "query",
  ],
});
