/**
 * Stackra file contract:
 * Purpose: `TRANSFER_LIST_DEMO_KEYS`, the typed keys of the native TransferList demos' words in
 *          `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const TRANSFER_LIST_DEMO_KEYS = keys({
  demo_free: {
    transfer_list: {
      basics: ["label", "available", "chosen", "riyadh", "jeddah", "dammam", "dubai", "kuwait"],
    },
  },
});
