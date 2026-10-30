/**
 * Stackra file contract:
 * Purpose: `LEAVE_CONFIRMATION_KEYS`, the typed keys of the web Leave confirmation demos' words in `assets/lang/<locale>/leave_confirmation.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The leave_confirmation namespace's keys. */
export const LEAVE_CONFIRMATION_KEYS = keys({
  leave_confirmation: [
    "note_label",
    "note_placeholder",
    "save",
    "leave",
    "dirty",
    "clean",
    "no_answer",
    "left",
    "stayed",
    "title",
    "description",
    "stay",
    "discard",
    "draft_text",
  ],
});
