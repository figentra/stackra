/**
 * Stackra file contract:
 * Purpose: `PRESS_FEEDBACK_DEMO_KEYS`, the typed keys of the native Press feedback demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The press_feedback demos' keys. */
export const PRESS_FEEDBACK_DEMO_KEYS = keys({
  demo_free: {
    press_feedback: {
      sample: ["scale", "highlight", "ripple", "sales", "value", "pressed"],
    },
  },
});
