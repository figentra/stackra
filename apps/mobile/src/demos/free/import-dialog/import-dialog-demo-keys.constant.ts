/**
 * Stackra file contract:
 * Purpose: `IMPORT_DIALOG_DEMO_KEYS`, the typed keys of the native ImportDialog demos' words in
 *          `assets/lang/<locale>/demo_free.json` (`demo_free.import_dialog.*`).
 * Boundary: keys only; the words live in the catalogues.
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`).
 */
import { keys } from "@stackra/i18n";

/** The import-dialog demos' keys. */
export const IMPORT_DIALOG_DEMO_KEYS = keys({
  demo_free: {
    import_dialog: {
      customers: ["open", "description", "name", "email", "phone", "city"],
      errors: ["open", "bad_email", "no_name", "bad_phone"],
      large: ["open", "description", "sku", "product", "price", "stock"],
    },
  },
});
