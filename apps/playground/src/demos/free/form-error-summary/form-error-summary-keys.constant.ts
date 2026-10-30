/**
 * Stackra file contract:
 * Purpose: `FORM_ERROR_SUMMARY_KEYS`, the typed keys of the web Form error summary demos' words in `assets/lang/<locale>/form_error_summary.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The form_error_summary namespace's keys. */
export const FORM_ERROR_SUMMARY_KEYS = keys({
  form_error_summary: [
    "form_name",
    "name",
    "name_error",
    "email",
    "email_error",
    "phone",
    "phone_error",
    "submit",
    "sent",
  ],
});
