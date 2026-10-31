/**
 * Stackra file contract:
 * Purpose: `SIGN_IN_KEYS`, the typed keys of the web sign-in demo's words in `assets/lang/<locale>/sign_in.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demo's keys. */
export const SIGN_IN_KEYS = keys({
  sign_in: {
    basics: [
      "title",
      "description",
      "email",
      "password",
      "remember",
      "submit",
      "forgot",
      "divider",
      "prompt",
      "sign_up",
      "with_email",
      "error",
    ],
  },
});
