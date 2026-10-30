/**
 * Stackra file contract:
 * Purpose: `PROGRESS_BUTTON_KEYS`, the typed keys of the web Progress button demos' words in `assets/lang/<locale>/progress_button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The progress_button namespace's keys. */
export const PROGRESS_BUTTON_KEYS = keys({
  progress_button: ["upload", "uploading", "uploaded"],
});
