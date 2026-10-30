/**
 * Stackra file contract:
 * Purpose: `TEXT_AREA_KEYS`, the typed keys of the web Text area demos' words in `assets/lang/<locale>/text_area.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The text_area namespace's keys. */
export const TEXT_AREA_KEYS = keys({
  text_area: [
    "primary",
    "secondary",
    "label_only",
    "with_placeholder",
    "placeholder",
    "with_description",
    "description",
    "two_lines",
    "six_lines",
    "required",
    "invalid",
    "invalid_message",
    "disabled",
    "read_only",
    "kept",
    "full",
    "content",
    "live_label",
    "live_description",
    "live_error",
    "live_count",
  ],
});
