/**
 * Stackra file contract:
 * Purpose: `FORM_DEMO_KEYS`, the typed keys of the native form demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The form demos' keys. */
export const FORM_DEMO_KEYS = keys({
  demo_free: {
    form: {
      description: ["field", "hint"],
      field_error: ["message", "valid_note"],
      label: ["default", "disabled", "invalid", "required"],
      live: [
        "email",
        "email_error",
        "email_hint",
        "not_sent",
        "notes",
        "notes_hint",
        "refused",
        "sent",
        "submit",
      ],
    },
  },
});
