/**
 * Stackra file contract:
 * Purpose: `CHECKBOX_FIELD_KEYS`, the typed keys of the web Checkbox field demos' words in `assets/lang/<locale>/checkbox_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The checkbox_field namespace's keys. */
export const CHECKBOX_FIELD_KEYS = keys({
  checkbox_field: [
    "agree",
    "terms",
    "agreed",
    "not_agreed",
    "required",
    "required_error",
    "disabled",
    "read_only",
  ],
});
