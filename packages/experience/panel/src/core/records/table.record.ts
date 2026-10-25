/**
 * Stackra file contract:
 * Purpose: `TableRecord<R>`, the builder a resource's `table(t)` member receives: the runtime side of `Table<R>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it. A later call of the same method replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1, 2, 5 and 12).
 */
import type { SortDirection } from "@stackra/contracts";

import { Count } from "#core/enums/count.enum";
import { ColumnsRecord } from "#core/records/columns.record";
import { FiltersRecord } from "#core/records/filters.record";
import type { ColumnBuilder } from "#core/types/column-builder.type";
import type { ColumnFactory } from "#core/types/column-factory.type";
import type { FilterBuilder } from "#core/types/filter-builder.type";
import type { FilterFactory } from "#core/types/filter-factory.type";
import type { Path } from "#core/types/path.type";
import type { SortNode } from "#core/types/sort-node.type";
import type { Table } from "#core/types/table.type";
import type { TableNode } from "#core/types/table-node.type";

/** A resource table over row type `R`. */
export class TableRecord<R> implements Table<R> {
  /** The column steps. */
  private columnSteps: readonly ColumnBuilder[] = [];

  /** The filter steps. */
  private filterSteps: readonly FilterBuilder[] = [];

  /** The default sort. */
  private sort: SortNode | undefined;

  /** The count mode. */
  private counted: Count = Count.Estimated;

  /** Sets the columns. */
  columns(build: (column: ColumnFactory<R>) => readonly ColumnBuilder[]): this {
    this.columnSteps = build(new ColumnsRecord<R>());
    return this;
  }

  /** Sets the filters. */
  filters(build: (filter: FilterFactory<R>) => readonly FilterBuilder[]): this {
    this.filterSteps = build(new FiltersRecord<R>());
    return this;
  }

  /** Sets the default sort. */
  defaultSort(key: Path<R>, direction: SortDirection): this {
    this.sort = Object.freeze({ key, direction });
    return this;
  }

  /** Sets the count mode. */
  count(count: Count): this {
    this.counted = count;
    return this;
  }

  /** The recorded table. */
  toNode(): TableNode {
    return Object.freeze({
      columns: Object.freeze(this.columnSteps.map((step) => step.toNode())),
      filters: Object.freeze(this.filterSteps.map((step) => step.toNode())),
      ...(this.sort === undefined ? {} : { defaultSort: this.sort }),
      count: this.counted,
    });
  }
}
