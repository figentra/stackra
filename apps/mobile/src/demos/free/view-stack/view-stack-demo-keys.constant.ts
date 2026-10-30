/**
 * Stackra file contract:
 * Purpose: `VIEW_STACK_DEMO_KEYS`, the typed keys of the native ViewStack demos' words in
 *          `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The view stack demos' keys. */
export const VIEW_STACK_DEMO_KEYS = keys({
  demo_free: {
    view_stack: {
      transitions: [
        "transition",
        "push",
        "push_parallax",
        "from_top",
        "fade",
        "none",
        "orders",
        "order",
        "open",
        "back",
        "status",
        "total",
      ],
    },
  },
});
