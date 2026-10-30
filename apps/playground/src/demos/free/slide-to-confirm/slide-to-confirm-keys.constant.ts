/**
 * Stackra file contract:
 * Purpose: `SLIDE_TO_CONFIRM_KEYS`, the typed keys of the web Slide to confirm demos' words in `assets/lang/<locale>/slide_to_confirm.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The slide_to_confirm namespace's keys. */
export const SLIDE_TO_CONFIRM_KEYS = keys({
  slide_to_confirm: ["charge", "charged", "close", "closed", "reset"],
});
