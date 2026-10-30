/**
 * Stackra file contract:
 * Purpose: `ACCOUNT_CONNECTION_KEYS`, the typed keys of the web Account connection demos' words in `assets/lang/<locale>/account_connection.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The account_connection namespace's keys. */
export const ACCOUNT_CONNECTION_KEYS = keys({
  account_connection: [
    "connected",
    "not_connected",
    "connect",
    "disconnect",
    "stripe",
    "stripe_description",
    "terms",
    "talabat",
    "talabat_description",
    "talabat_account",
    "xero",
    "xero_description",
    "xero_account",
  ],
});
