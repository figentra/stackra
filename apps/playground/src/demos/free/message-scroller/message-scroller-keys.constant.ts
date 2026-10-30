/**
 * Stackra file contract:
 * Purpose: `MESSAGE_SCROLLER_KEYS`, the typed keys of the web MessageScroller demos' words in `assets/lang/<locale>/message_scroller.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const MESSAGE_SCROLLER_KEYS = keys({
  message_scroller: {
    streaming: ["question", "answer", "ask", "earlier_1", "earlier_2", "earlier_3"],
    new_count: ["receive", "incoming", "first", "hint"],
  },
});
