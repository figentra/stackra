/**
 * Stackra file contract:
 * Purpose: `DATE_FIELD_KEYS`, the typed keys of the web Date field demos' words in `assets/lang/<locale>/date_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The date_field namespace's keys. */
export const DATE_FIELD_KEYS = keys({
  date_field: [
    "empty",
    "empty_description",
    "filled",
    "filled_description",
    "bounded_label",
    "bounded_description",
    "bounded_message",
    "invalid",
    "invalid_message",
    "read_only",
    "disabled",
    "live_label",
    "live_empty",
    "live_chosen",
  ],
});
