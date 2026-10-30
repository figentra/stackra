/**
 * Stackra file contract:
 * Purpose: `ICON_BUTTON_KEYS`, the typed keys of the web Icon button demos' words in `assets/lang/<locale>/icon_button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The icon_button namespace's keys. */
export const ICON_BUTTON_KEYS = keys({
  icon_button: [
    "size",
    "settings",
    "delete",
    "disabled",
    "loading",
    "count",
    "load",
    "presses",
    "load_state",
  ],
});
