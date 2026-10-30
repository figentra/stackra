/**
 * Stackra file contract:
 * Purpose: `PRESS_FEEDBACK_KEYS`, the typed keys of the web Press feedback demos' words in `assets/lang/<locale>/press_feedback.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The press_feedback namespace's keys. */
export const PRESS_FEEDBACK_KEYS = keys({
  press_feedback: ["scale", "highlight", "ripple", "sales", "value", "pressed"],
});
