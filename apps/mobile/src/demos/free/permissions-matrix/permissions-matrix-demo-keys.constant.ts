/**
 * Stackra file contract:
 * Purpose: `PERMISSIONS_MATRIX_DEMO_KEYS`, the typed keys of the native permissions-matrix demos' words in
 *          `assets/lang/<locale>/demo_free.json`: POS and warehouse roles, groups and permissions.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The permissions-matrix demos' keys. */
export const PERMISSIONS_MATRIX_DEMO_KEYS = keys({
  demo_free: {
    permissions_matrix: {
      _: ["store_roles", "cashier_access", "warehouse_roles"],
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
  },
});
