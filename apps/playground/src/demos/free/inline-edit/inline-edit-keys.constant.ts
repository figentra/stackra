/**
 * Stackra file contract:
 * Purpose: `INLINE_EDIT_KEYS`, the typed keys of the web Inline edit demos' words in `assets/lang/<locale>/inline_edit.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The inline_edit namespace's keys. */
export const INLINE_EDIT_KEYS = keys({
  inline_edit: [
    "store",
    "store_value",
    "product",
    "product_value",
    "note",
    "note_placeholder",
    "sku",
    "sku_error",
    "name_required",
    "read_only",
    "tax_value",
    "disabled",
    "saved",
  ],
});
