/**
 * Stackra file contract:
 * Purpose: `TEXT_FIELD_KEYS`, the typed keys of the web Text field demos' words in `assets/lang/<locale>/text_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The text_field namespace's keys. */
export const TEXT_FIELD_KEYS = keys({
  text_field: [
    "primary",
    "secondary",
    "label_only",
    "with_placeholder",
    "placeholder",
    "with_description",
    "description",
    "required",
    "invalid",
    "invalid_message",
    "disabled",
    "read_only",
    "kept",
    "kind_label",
    "full",
    "content",
    "live_label",
    "live_description",
    "live_error",
    "live_empty",
    "live_typed",
  ],
});
