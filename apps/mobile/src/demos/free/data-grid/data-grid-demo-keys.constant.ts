/**
 * Stackra file contract:
 * Purpose: `DATA_GRID_DEMO_KEYS`, the typed keys of the native DataGrid demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The data_grid demos' keys. */
export const DATA_GRID_DEMO_KEYS = keys({
  demo_free: {
    data_grid: [
      "sheet_label",
      "matrix_label",
      "item",
      "price",
      "size",
      "in_stock",
      "colour",
      "small",
      "large",
      "latte",
      "mocha",
      "flat_white",
      "espresso",
      "black",
      "white",
      "olive",
    ],
  },
});
