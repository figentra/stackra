/**
 * Stackra file contract:
 * Purpose: `FORM_KEYS`, the typed keys of the web Form demos' words in `assets/lang/<locale>/form.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The form namespace's keys. */
export const FORM_KEYS = keys({
  form: [
    "label_default",
    "label_required",
    "label_invalid",
    "label_disabled",
    "display_name",
    "display_name_hint",
    "invalid_field",
    "invalid_message",
    "valid_field",
    "valid_note",
    "form_name",
    "email",
    "email_hint",
    "email_error",
    "notes",
    "notes_hint",
    "submit",
    "mod_enter",
    "not_sent",
    "refused",
    "sent",
  ],
});
