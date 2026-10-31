/**
 * Stackra file contract:
 * Purpose: `CollectionColumn`, the one column type of the data family: a `TableColumn` plus what the engine needs to
 *          filter, group, total and hide it, and what the cell editors need to edit it (DataTable in place, DataGrid as a
 *          sheet): its kind, choices, rules and editability.
 * Boundary: types only. The engine reads a cell's value as `item[column.id]`; `type` drives the filter operators, the
 *           sort and the editor. It replaced `DataGridColumn` (2026-10-31); `validate` returns the app's own message in
 *           the active locale, or undefined when the value is fine (the editors add the required, range and type checks).
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0505 (one column type);
 *          WCAG 2.2 SC 3.3.1; STA-1371.
 */
import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { RuleFieldType } from "#contracts/enums/rule-field-type.enum";
import type { BooleanFilterDefinition } from "#contracts/types/boolean-filter-definition.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";
import type { NumberFilterDefinition } from "#contracts/types/number-filter-definition.type";
import type { SelectItem } from "#contracts/types/select-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import type { TextFilterDefinition } from "#contracts/types/text-filter-definition.type";

/** One column of a collection. */
export interface CollectionColumn extends TableColumn {
  /**
   * The kind of value: `text` (the default), `number`, `choice`, `date` (an ISO calendar day) or `boolean`; it picks the
   * filter operators, the sort and the editor.
   */
  readonly type?: RuleFieldType | undefined;
  /** The choices of a `choice` column, for its filter and its editor. */
  readonly options?: readonly SelectItem[] | undefined;
  /** True to start hidden; the column editor can show it. */
  readonly isHidden?: boolean | undefined;
  /** False to keep the column always shown; the row header is always shown. */
  readonly isHideable?: boolean | undefined;
  /** True to offer "Group by" on this column. */
  readonly isGroupable?: boolean | undefined;
  /** False to leave the column out of the filters, the filter builder and the quick search. */
  readonly isFilterable?: boolean | undefined;
  /**
   * How the column's quick filter edits: the hint of a `text` filter, the step and number format (a currency, say) of a
   * `number` filter, the yes and no words of a `boolean` filter, and `isDisabled` to list the filter but refuse adding
   * it (while its choices load, say). A setting of another kind is ignored.
   */
  readonly filter?:
    | (Pick<TextFilterDefinition, "placeholder" | "isDisabled"> &
        Pick<NumberFilterDefinition, "step" | "formatOptions"> &
        Pick<BooleanFilterDefinition, "trueLabel" | "falseLabel">)
    | undefined;
  /** The aggregate the footer shows for the column at first. */
  readonly aggregate?: AggregateKind | undefined;
  /** True to let a DataTable edit the cell in place (with `onCellEdit`). A DataGrid edits every column not read-only. */
  readonly isEditable?: boolean | undefined;
  /** True to refuse edits in this column everywhere; the first column of a DataGrid matrix is always read-only. */
  readonly isReadOnly?: boolean | undefined;
  /** True when an empty cell is an error. */
  readonly isRequired?: boolean | undefined;
  /** The least value of a `number` column. */
  readonly min?: number | undefined;
  /** The greatest value of a `number` column. */
  readonly max?: number | undefined;
  /** The app's own rule: a message in the active locale for a bad value, or undefined. */
  readonly validate?: ((value: DataGridValue, row: DataGridRow) => string | undefined) | undefined;
}
