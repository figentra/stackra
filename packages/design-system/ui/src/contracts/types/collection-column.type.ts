/**
 * Stackra file contract:
 * Purpose: `CollectionColumn`, one column of a collection: a `TableColumn` plus what the engine needs to filter, group, total and hide it.
 * Boundary: types only. The engine reads a cell's value as `item[column.id]`; `type` drives the filter operators and the sort.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { RuleFieldType } from "#contracts/enums/rule-field-type.enum";
import type { SelectItem } from "#contracts/types/select-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";

/** One column of a collection. */
export interface CollectionColumn extends TableColumn {
  /** The kind of value: `text` (the default), `number` or `choice`; it picks the filter operators and the sort. */
  readonly type?: RuleFieldType | undefined;
  /** The choices of a `choice` column, for its filter. */
  readonly options?: readonly SelectItem[] | undefined;
  /** True to start hidden; the column editor can show it. */
  readonly isHidden?: boolean | undefined;
  /** False to keep the column always shown; the row header is always shown. */
  readonly isHideable?: boolean | undefined;
  /** True to offer "Group by" on this column. */
  readonly isGroupable?: boolean | undefined;
  /** False to leave the column out of the filter builder and the quick search. */
  readonly isFilterable?: boolean | undefined;
  /** The aggregate the footer shows for the column at first. */
  readonly aggregate?: AggregateKind | undefined;
}
