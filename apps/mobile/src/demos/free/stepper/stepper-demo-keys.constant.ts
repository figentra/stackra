/**
 * Stackra file contract:
 * Purpose: `STEPPER_DEMO_KEYS`, the typed keys of the native Stepper demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const STEPPER_DEMO_KEYS = keys({
  demo_free: {
    stepper: {
      horizontal: ["label", "cart", "shipping", "payment", "review", "back", "next", "place"],
      vertical: [
        "label",
        "profile",
        "profile_note",
        "products",
        "products_note",
        "payments",
        "payments_note",
        "domain",
        "launch",
      ],
      error: ["label", "upload", "columns", "rows", "rows_note", "import"],
      compact: ["label", "basics", "pricing", "stock", "review", "back", "next"],
    },
  },
});
