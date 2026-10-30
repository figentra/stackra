/**
 * Stackra file contract:
 * Purpose: `PERMISSIONS_MATRIX_KEYS`, the typed keys of the web PermissionsMatrix demos' words in
 *          `assets/lang/<locale>/permissions_matrix.json`: POS and warehouse roles, groups and permissions.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The permissions_matrix namespace's keys. */
export const PERMISSIONS_MATRIX_KEYS = keys({
  permissions_matrix: {
    _: ["store_roles", "cashier_access", "warehouse_roles", "changes", "save", "reset", "saved"],
    role: ["cashier", "supervisor", "manager", "owner", "picker", "receiver", "stock_controller"],
    group: ["sales", "cash", "inventory", "receiving", "picking"],
    permission_name: [
      "sell",
      "discount",
      "refund",
      "void",
      "open_drawer",
      "count_cash",
      "close_shift",
      "receive",
      "adjust",
      "transfer",
      "check_in",
      "put_away",
      "pick",
      "pack",
    ],
    description: ["discount", "refund", "void", "adjust"],
  },
});
