/**
 * Stackra file contract:
 * Purpose: `PROPERTY_LIST_KEYS`, the typed keys of the web Property list demos' words in `assets/lang/<locale>/property_list.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The property_list namespace's keys. */
export const PROPERTY_LIST_KEYS = keys({
  property_list: [
    "one_column",
    "two_columns",
    "values_default",
    "values_custom",
    "not_set",
    "copyable_list",
    "two_columns_switch",
    "copied_label",
    "last_copied",
    "nothing_copied",
    "customer",
    "customer_value",
    "email",
    "email_value",
    "order_id",
    "order_id_value",
    "copy_order_id",
    "copy_email",
    "status",
    "paid",
    "items",
    "note",
    "phone",
    "total",
    "total_value",
    "copy_total",
    "total_copy_value",
    "zero_label",
  ],
});
