/**
 * Stackra file contract:
 * Purpose: `BIDI_DEMO_KEYS`, the typed keys of the native bidi demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The bidi demos' keys. */
export const BIDI_DEMO_KEYS = keys({
  demo_free: {
    bidi: {
      mixed_text: ["customer", "phone", "email", "sku", "order_ready"],
      local_direction: ["transfer", "iban", "note", "note_value"],
      directional_motion: ["cart", "payment", "receipt", "next", "back", "step_of"],
    },
  },
});
