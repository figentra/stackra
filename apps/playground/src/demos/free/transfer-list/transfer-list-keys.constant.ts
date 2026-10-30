/**
 * Stackra file contract:
 * Purpose: `TRANSFER_LIST_KEYS`, the typed keys of the web TransferList demos' words in
 *          `assets/lang/<locale>/transfer_list.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const TRANSFER_LIST_KEYS = keys({
  transfer_list: {
    basics: [
      "label",
      "description",
      "available",
      "chosen",
      "riyadh",
      "riyadh_note",
      "jeddah",
      "jeddah_note",
      "dammam",
      "dammam_note",
      "medina",
      "medina_note",
      "dubai",
      "dubai_note",
      "kuwait",
      "kuwait_note",
    ],
    export_columns: [
      "label",
      "available",
      "chosen",
      "number",
      "number_note",
      "date",
      "customer",
      "phone",
      "total",
      "tax",
      "payment",
      "status",
      "courier",
      "summary",
    ],
  },
});
