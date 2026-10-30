/**
 * Stackra file contract:
 * Purpose: `CLOSE_BUTTON_KEYS`, the typed keys of the web Close button demos' words in `assets/lang/<locale>/close_button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The close_button namespace's keys. */
export const CLOSE_BUTTON_KEYS = keys({
  close_button: [
    "default",
    "custom",
    "disabled",
    "notice_title",
    "notice_body",
    "dismiss",
    "show_again",
    "hidden",
  ],
});
