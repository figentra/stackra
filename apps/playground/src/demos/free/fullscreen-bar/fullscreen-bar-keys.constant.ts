/**
 * Stackra file contract:
 * Purpose: `FULLSCREEN_BAR_KEYS`, the typed keys of the web FullscreenBar demos' words in `assets/lang/<locale>/fullscreen_bar.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The fullscreen_bar namespace's keys. */
export const FULLSCREEN_BAR_KEYS = keys({
  fullscreen_bar: {
    _: ["screen_name", "exited", "enter_again", "hint", "hint_locked"],
    register: ["title", "lock", "basket"],
    kds: ["title", "tickets"],
    editor: ["title", "save", "body"],
  },
});
