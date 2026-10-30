/**
 * Stackra file contract:
 * Purpose: `FORM_FIELD_KEYS`, the typed keys of the web Form field demos' words in `assets/lang/<locale>/form_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The form_field namespace's keys. */
export const FORM_FIELD_KEYS = keys({
  form_field: [
    "form_name",
    "email",
    "email_hint",
    "email_required",
    "email_pattern",
    "email_taken",
    "plan",
    "free",
    "team",
    "terms",
    "terms_required",
    "save",
    "reject",
    "reset",
    "idle",
    "refused",
    "saved",
    "states_name",
    "required",
    "invalid",
    "invalid_message",
    "disabled",
    "valid",
    "kept",
    "ada",
  ],
});
