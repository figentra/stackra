/**
 * Stackra file contract:
 * Purpose: `TOGGLE_BUTTON_KEYS`, the typed keys of the web Toggle button demos' words in `assets/lang/<locale>/toggle_button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The toggle_button namespace's keys. */
export const TOGGLE_BUTTON_KEYS = keys({
  toggle_button: [
    "mute",
    "favourite",
    "format",
    "bold",
    "italic",
    "underline",
    "align",
    "start",
    "center",
    "end",
  ],
});
