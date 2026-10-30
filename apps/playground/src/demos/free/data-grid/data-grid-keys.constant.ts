/**
 * Stackra file contract:
 * Purpose: `DATA_GRID_KEYS`, the typed keys of the web DataGrid demos' words in `assets/lang/<locale>/data_grid.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The data_grid namespace's keys. */
export const DATA_GRID_KEYS = keys({
  data_grid: [
    "sheet_label",
    "matrix_label",
    "hint",
    "saved",
    "item",
    "price",
    "size",
    "in_stock",
    "from",
    "colour",
    "small",
    "large",
    "latte",
    "mocha",
    "flat_white",
    "espresso",
    "cortado",
    "black",
    "white",
    "olive",
    "price_rule",
  ],
});
