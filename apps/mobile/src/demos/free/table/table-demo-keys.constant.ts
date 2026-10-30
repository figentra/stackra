/**
 * Stackra file contract:
 * Purpose: `TABLE_DEMO_KEYS`, the typed keys of the native table demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The table demos' keys. */
export const TABLE_DEMO_KEYS = keys({
  demo_free: {
    table: {
      basics: ["label"],
      cells: ["label"],
      columns: ["customer", "order", "status", "total"],
      selection: ["chosen", "multiple", "none", "single"],
      sorting: ["label", "none", "sorted"],
      states: [
        "empty_body",
        "empty_label",
        "empty_title",
        "loading",
        "loading_label",
        "reload_label",
      ],
      status: ["paid", "pending", "refunded"],
    },
  },
});
