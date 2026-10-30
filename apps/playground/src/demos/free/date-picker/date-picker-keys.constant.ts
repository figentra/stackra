/**
 * Stackra file contract:
 * Purpose: `DATE_PICKER_KEYS`, the typed keys of the web Date picker demos' words in `assets/lang/<locale>/date_picker.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The date_picker namespace's keys. */
export const DATE_PICKER_KEYS = keys({
  date_picker: [
    "empty",
    "empty_description",
    "empty_button",
    "filled",
    "filled_description",
    "filled_button",
    "bounded_label",
    "bounded_description",
    "bounded_message",
    "bounded_button",
    "invalid",
    "invalid_message",
    "invalid_button",
    "read_only",
    "disabled",
    "live_label",
    "live_button",
    "live_empty",
    "live_chosen",
    "live_open",
    "live_closed",
    "open_from_outside",
  ],
});
