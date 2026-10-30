/**
 * Stackra file contract:
 * Purpose: `ADDRESS_FIELD_KEYS`, the typed keys of the web Address field demos' words in `assets/lang/<locale>/address_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const ADDRESS_FIELD_KEYS = keys({
  address_field: {
    basics: ["label", "hint"],
    container: ["narrow", "wide", "billing", "shipping"],
  },
});
