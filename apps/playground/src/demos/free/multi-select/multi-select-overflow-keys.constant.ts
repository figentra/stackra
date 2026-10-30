/**
 * Stackra file contract:
 * Purpose: `MULTI_SELECT_OVERFLOW_KEYS`, the typed keys of the web MultiSelect overflow demos' words in `assets/lang/<locale>/multi_select_overflow.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const MULTI_SELECT_OVERFLOW_KEYS = keys({
  multi_select_overflow: ["label", "riyadh", "jeddah", "dammam", "makkah", "madinah", "abha"],
});
