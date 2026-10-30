/**
 * Stackra file contract:
 * Purpose: `CONTEXT_MENU_KEYS`, the typed keys of the web Context menu demos' words in `assets/lang/<locale>/context_menu.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The context_menu namespace's keys. */
export const CONTEXT_MENU_KEYS = keys({
  context_menu: [
    "label",
    "hint",
    "open",
    "duplicate",
    "archive",
    "delete",
    "chosen",
    "actions",
    "danger",
  ],
});
