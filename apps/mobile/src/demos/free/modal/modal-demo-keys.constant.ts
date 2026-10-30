/**
 * Stackra file contract:
 * Purpose: `MODAL_DEMO_KEYS`, the typed keys of the native modal demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The modal demos' keys. */
export const MODAL_DEMO_KEYS = keys({
  demo_free: {
    modal: {
      basics: ["body", "close", "heading", "open"],
      controlled: [
        "body",
        "cancel",
        "close",
        "heading",
        "is_closed",
        "is_open",
        "last",
        "none",
        "open",
        "send",
      ],
      locked: ["accept", "body", "heading", "open"],
      motion: ["body", "close", "heading", "slide_up", "stick_top", "slide_side"],
      position: ["body", "close", "heading", "open"],
      sizes: ["body", "close", "heading", "open"],
    },
  },
});
