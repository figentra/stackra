/**
 * Stackra file contract:
 * Purpose: `SIGN_IN_DEMO_KEYS`, the typed keys of the native SignIn demo's words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demo's keys. */
export const SIGN_IN_DEMO_KEYS = keys({
  demo_free: {
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
  },
});
