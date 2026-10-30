/**
 * Stackra file contract:
 * Purpose: `DATA_VIEW_DEMO_KEYS`, the typed keys of the native DataView demo's words in
 *          `assets/lang/<locale>/demo_free.json` (the Gulf orders and the labels).
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The data-view demos' keys. */
export const DATA_VIEW_DEMO_KEYS = keys({
  demo_free: {
    data_view: {
      orders: [
        "label",
        "customer_0",
        "customer_1",
        "customer_2",
        "customer_3",
        "customer_4",
        "customer_5",
        "city_0",
        "city_1",
        "city_2",
        "status_paid",
        "status_pending",
        "status_shipped",
        "column_order",
        "column_customer",
        "column_city",
        "column_status",
        "column_total",
        "amount",
      ],
    },
  },
});
