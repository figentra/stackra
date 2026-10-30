/**
 * Stackra file contract:
 * Purpose: `NUMBER_PAD_KEYS`, the typed keys of the web Number pad demos' words in `assets/lang/<locale>/number_pad.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The number_pad namespace's keys. */
export const NUMBER_PAD_KEYS = keys({
  number_pad: ["amount", "pin", "complete", "enter"],
});
