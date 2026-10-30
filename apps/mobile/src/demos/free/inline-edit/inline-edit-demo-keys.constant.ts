/**
 * Stackra file contract:
 * Purpose: `INLINE_EDIT_DEMO_KEYS`, the typed keys of the native inline-edit demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The inline-edit demos' keys. */
export const INLINE_EDIT_DEMO_KEYS = keys({
  demo_free: {
    inline_edit: {
      basics: [
        "store",
        "store_value",
        "product",
        "product_value",
        "note",
        "note_placeholder",
        "saved",
      ],
      validation: ["sku", "sku_error", "store", "store_value", "name_required"],
      states: ["read_only", "tax_value", "disabled", "store_value"],
    },
  },
});
