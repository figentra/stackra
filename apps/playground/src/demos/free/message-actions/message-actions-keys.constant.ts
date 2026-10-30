/**
 * Stackra file contract:
 * Purpose: `MESSAGE_ACTIONS_KEYS`, the typed keys of the web MessageActions demos' words in `assets/lang/<locale>/message_actions.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const MESSAGE_ACTIONS_KEYS = keys({
  message_actions: {
    basics: ["answer", "retried", "edited"],
    feedback: ["answer", "thanks_up", "thanks_down", "none"],
  },
});
