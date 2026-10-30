/**
 * Stackra file contract:
 * Purpose: `TOGGLE_BUTTON_DEMO_KEYS`, the typed keys of the native Toggle button demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The toggle_button demos' keys. */
export const TOGGLE_BUTTON_DEMO_KEYS = keys({
  demo_free: {
    toggle_button: {
      sample: [
        "mute",
        "favourite",
        "format",
        "bold",
        "italic",
        "underline",
        "align",
        "start",
        "center",
        "end",
      ],
    },
  },
});
