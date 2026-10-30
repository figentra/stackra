/**
 * Stackra file contract:
 * Purpose: `PASSWORD_FIELD_KEYS`, the typed keys of the web Password field demos' words in `assets/lang/<locale>/password_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The password_field namespace's keys. */
export const PASSWORD_FIELD_KEYS = keys({
  password_field: [
    "password",
    "password_hint",
    "pin",
    "pin_hint",
    "pin_wrong",
    "pin_demo",
    "unlock",
    "unlocked",
    "kiosk",
    "disabled",
  ],
});
