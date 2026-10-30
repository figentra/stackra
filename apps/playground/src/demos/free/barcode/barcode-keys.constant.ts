/**
 * Stackra file contract:
 * Purpose: `BARCODE_KEYS`, the typed keys of the web Barcode demos' words in `assets/lang/<locale>/barcode.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const BARCODE_KEYS = keys({
  barcode: {
    product_ean: ["product", "price", "label"],
    shipping_label: ["title", "to", "label"],
    invalid: ["caption"],
  },
});
