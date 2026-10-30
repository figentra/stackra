/**
 * Stackra file contract:
 * Purpose: `POPCONFIRM_DEMO_KEYS`, the typed keys of the native Popconfirm demos' words in
 *          `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const POPCONFIRM_DEMO_KEYS = keys({
  demo_free: {
    popconfirm: {
      basics: ["draft", "trigger", "title", "description", "confirm", "cancel", "deleted"],
      async_confirm: ["order", "trigger", "title", "description", "confirm", "refunded"],
    },
  },
});
