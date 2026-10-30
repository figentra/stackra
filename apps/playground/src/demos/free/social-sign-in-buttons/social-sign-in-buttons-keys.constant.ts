/**
 * Stackra file contract:
 * Purpose: `SOCIAL_SIGN_IN_BUTTONS_KEYS`, the typed keys of the web Social sign-in buttons demos' words in `assets/lang/<locale>/social_sign_in_buttons.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The social_sign_in_buttons namespace's keys. */
export const SOCIAL_SIGN_IN_BUTTONS_KEYS = keys({
  social_sign_in_buttons: ["email", "signing", "compact"],
});
