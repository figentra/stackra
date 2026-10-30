/**
 * Stackra file contract:
 * Purpose: `COPY_BUTTON_DEMO_KEYS`, the typed keys of the native CopyButton demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The copy_button demos' keys. */
export const COPY_BUTTON_DEMO_KEYS = keys({
  demo_free: {
    copy_button: {
      order_number: ["order", "copy_order", "order_copied"],
      api_key: ["api_key", "copy_key", "key_copied"],
      variants: ["variant"],
    },
  },
});
