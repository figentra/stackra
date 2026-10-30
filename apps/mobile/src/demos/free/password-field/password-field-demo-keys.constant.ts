/**
 * Stackra file contract:
 * Purpose: `PASSWORD_FIELD_DEMO_KEYS`, the typed keys of the native password-field demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The password-field demos' keys. */
export const PASSWORD_FIELD_DEMO_KEYS = keys({
  demo_free: {
    password_field: {
      basics: ["password", "password_hint"],
      pin: ["pin", "pin_demo", "pin_wrong", "unlock", "unlocked"],
      states: ["kiosk", "disabled"],
    },
  },
});
