/**
 * Stackra file contract:
 * Purpose: `SEARCH_FIELD_KEYS`, the typed keys of the web Search field demos' words in `assets/lang/<locale>/search_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The search_field namespace's keys. */
export const SEARCH_FIELD_KEYS = keys({
  search_field: [
    "label",
    "placeholder",
    "described_label",
    "described_placeholder",
    "description",
    "hidden_label_name",
    "hidden_label_placeholder",
    "primary",
    "secondary",
    "full_width",
    "full_width_note",
    "with_value",
    "required",
    "invalid",
    "invalid_error",
    "disabled",
    "read_only",
    "loading",
    "sample_text",
    "live_label",
    "live_placeholder",
    "live_clear",
    "results",
    "count",
    "submitted",
    "cleared",
    "none",
  ],
});
