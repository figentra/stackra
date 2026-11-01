/**
 * Stackra file contract:
 * Purpose: `KEYBOARD_SHORTCUTS_KEYS`, the typed keys of the keyboard-shortcuts demos' words in
 *          `assets/lang/<locale>/keyboard_shortcuts.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The keyboard_shortcuts namespace's keys. */
export const KEYBOARD_SHORTCUTS_KEYS = keys({
  keyboard_shortcuts: [
    "toolbar",
    "save",
    "duplicate",
    "archive",
    "search",
    "ask_tamo",
    "ran",
    "idle",
    "visible",
    "hidden",
    "visible_help",
    "hidden_help",
    "reveal_help",
    "bold",
    "italic",
    "underline",
    "comment",
    "open_sheet",
    "sheet_help",
    "settings_help",
    "new_order",
    "refund",
    "print",
  ],
});
