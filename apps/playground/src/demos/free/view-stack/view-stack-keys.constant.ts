/**
 * Stackra file contract:
 * Purpose: `VIEW_STACK_KEYS`, the typed keys of the web ViewStack demos' words in `assets/lang/<locale>/view_stack.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The view_stack namespace's keys. */
export const VIEW_STACK_KEYS = keys({
  view_stack: {
    _: ["transition_label", "orders", "order", "open", "back", "status", "total"],
    transitions: ["push", "push_parallax", "from_top", "fade", "none"],
  },
});
