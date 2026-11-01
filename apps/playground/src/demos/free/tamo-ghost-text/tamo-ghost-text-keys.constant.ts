/**
 * Stackra file contract:
 * Purpose: `TAMO_GHOST_TEXT_KEYS`, the typed keys of the web tamo-ghost-text demos' words in `assets/lang/<locale>/tamo_ghost_text.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tamo_ghost_text namespace's keys. */
export const TAMO_GHOST_TEXT_KEYS = keys({
  tamo_ghost_text: ["label", "text", "suggestion", "again", "kept"],
});
