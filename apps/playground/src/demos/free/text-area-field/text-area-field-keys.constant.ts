/**
 * Stackra file contract:
 * Purpose: `TEXT_AREA_FIELD_KEYS`, the typed keys of the web Text area field demos' words in `assets/lang/<locale>/text_area_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The text_area_field namespace's keys. */
export const TEXT_AREA_FIELD_KEYS = keys({
  text_area_field: [
    "note",
    "note_hint",
    "reason",
    "reason_value",
    "live_label",
    "live_description",
    "live_error",
    "live_count",
  ],
});
