/**
 * Stackra file contract:
 * Purpose: `PROGRESS_CIRCLE_KEYS`, the typed keys of the web Progress circle demos' words in `assets/lang/<locale>/progress_circle.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The progress_circle namespace's keys. */
export const PROGRESS_CIRCLE_KEYS = keys({
  progress_circle: [
    "size_label",
    "tone_label",
    "value_label",
    "indeterminate_label",
    "beside_label",
    "beside_text",
    "action_label",
    "advance",
    "reset",
    "complete",
  ],
});
