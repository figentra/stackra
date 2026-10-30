/**
 * Stackra file contract:
 * Purpose: `DATA_GRID_KEYS`, the keys of the DataGrid's, ColumnChooser's, SavedViews' and the DataTable group and
 *          total rows' words in `assets/lang/<locale>/ui.json`.
 * Boundary: keys only; each key exists in every base locale this package ships.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0403 (seven languages); ADR 0317 amendment 2026-10-28.
 */
import { keys } from "@stackra/i18n";

/** The DataGrid and DataTable tools' keys. */
export const DATA_GRID_KEYS = keys({
  ui: {
    data_grid: [
      "changes",
      "errors",
      "undo",
      "redo",
      "total",
      "required",
      "type",
      "min",
      "max",
      "edit",
      "edit_row",
      "bulk_edit",
      "bulk_edit_title",
      "bulk_column",
      "bulk_value",
      "apply",
      "cancel",
      "done",
      "select",
      "selected",
      "fill_handle",
      "yes",
      "no",
    ],
    data_table_tools: [
      "columns",
      "views",
      "save_view",
      "group_count",
      "total",
      "aggregate_sum",
      "aggregate_avg",
      "aggregate_min",
      "aggregate_max",
      "aggregate_count",
    ],
  },
});
