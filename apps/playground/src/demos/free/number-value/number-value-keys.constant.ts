/**
 * Stackra file contract:
 * Purpose: `NUMBER_VALUE_KEYS`, the typed keys of the web Number value demos' words in `assets/lang/<locale>/number_value.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const NUMBER_VALUE_KEYS = keys({
  number_value: {
    summary: ["revenue", "orders", "growth", "export"],
    compact: ["note"],
    arabic: ["revenue", "orders", "growth", "export"],
  },
});
