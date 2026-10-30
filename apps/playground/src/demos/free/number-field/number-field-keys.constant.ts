/**
 * Stackra file contract:
 * Purpose: `NUMBER_FIELD_KEYS`, the typed keys of the web Number field demos' words in `assets/lang/<locale>/number_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The number_field namespace's keys. */
export const NUMBER_FIELD_KEYS = keys({
  number_field: [
    "plain",
    "plain_description",
    "bounded",
    "bounded_description",
    "percent",
    "percent_description",
    "currency",
    "currency_description",
    "no_steppers",
    "no_steppers_description",
    "invalid",
    "invalid_message",
    "disabled",
    "read_only",
    "live_label",
    "live_description",
    "live_empty",
    "live_chosen",
  ],
});
