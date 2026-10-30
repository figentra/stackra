/**
 * Stackra file contract:
 * Purpose: `NUMBER_TICKER_KEYS`, the typed keys of the web NumberTicker demos' words in
 *          `assets/lang/<locale>/number_ticker.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The number_ticker namespace's keys. */
export const NUMBER_TICKER_KEYS = keys({
  number_ticker: ["sales", "add", "revenue", "reset"],
});
