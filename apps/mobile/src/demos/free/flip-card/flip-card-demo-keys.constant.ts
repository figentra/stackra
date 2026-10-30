/**
 * Stackra file contract:
 * Purpose: `FLIP_CARD_DEMO_KEYS`, the typed keys of the native Flip card demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The flip_card demos' keys. */
export const FLIP_CARD_DEMO_KEYS = keys({
  demo_free: {
    flip_card: {
      sample: ["name", "price", "details", "body", "flip", "hint"],
    },
  },
});
