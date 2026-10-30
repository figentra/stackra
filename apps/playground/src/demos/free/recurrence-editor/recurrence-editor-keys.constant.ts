/**
 * Stackra file contract:
 * Purpose: `RECURRENCE_EDITOR_KEYS`, the typed keys of the web RecurrenceEditor demos' words in
 *          `assets/lang/<locale>/recurrence_editor.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const RECURRENCE_EDITOR_KEYS = keys({
  recurrence_editor: {
    _: ["stored"],
    weekly: ["label"],
    monthly: ["label"],
    hijri: ["label"],
    rtl: ["label"],
  },
});
