/**
 * Stackra file contract:
 * Purpose: `BUTTON_KEYS`, the typed keys of the button page's words in `assets/lang/<locale>/button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The button namespace's keys. */
export const BUTTON_KEYS = keys({
  button: {
    _: ["document_title", "intro"],
    variants: ["title", "note", "size"],
    states: ["title", "note", "default", "disabled", "loading"],
    icons: ["title", "note", "add", "next", "download"],
    full_width: ["title", "note", "primary", "secondary"],
    live: ["title", "note", "save", "saving", "idle", "count", "count_disabled", "presses"],
  },
});
