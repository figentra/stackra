/**
 * Stackra file contract:
 * Purpose: `MORPH_BUTTON_KEYS`, the typed keys of the web Morph button demos' words in `assets/lang/<locale>/morph_button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The morph_button namespace's keys. */
export const MORPH_BUTTON_KEYS = keys({
  morph_button: ["pay", "paying", "paid", "failed", "fail_next"],
});
