/**
 * Stackra file contract:
 * Purpose: `AI_MARK_KEYS`, the typed keys of the web Ai mark demos' words in `assets/lang/<locale>/ai_mark.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The ai_mark namespace's keys. */
export const AI_MARK_KEYS = keys({
  ai_mark: ["capable", "changed", "generated", "action", "record", "content"],
});
