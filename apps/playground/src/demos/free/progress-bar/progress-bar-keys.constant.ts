/**
 * Stackra file contract:
 * Purpose: `PROGRESS_BAR_KEYS`, the typed keys of the web Progress bar demos' words in `assets/lang/<locale>/progress_bar.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The progress_bar namespace's keys. */
export const PROGRESS_BAR_KEYS = keys({
  progress_bar: [
    "size_label",
    "tone_label",
    "value_label",
    "indeterminate_label",
    "storage",
    "files",
    "files_text",
    "action_label",
    "advance",
    "reset",
    "complete",
  ],
});
