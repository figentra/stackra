/**
 * Stackra file contract:
 * Purpose: `ResourceTableProps`, the props of the internal data table the List page and every relation manager draw.
 * Boundary: props only; internal to the resource pages.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 1, 2 and 11); ADR 0164.
 */
import type { QueryRef } from "@stackra/clients";
import type { ResourceAction } from "@stackra/ui/contracts";
import type { ReactElement } from "react";

import type { SavedView } from "#core/schemas/saved-view.schema";
import type { TableNode } from "#core/types/table-node.type";
import type { ViewNode } from "#core/types/view-node.type";

/** Props of `ResourceTable`. */
export interface ResourceTableProps {
  /** The resource key whose labels the columns and filters take. */
  readonly resourceKey: string;
  /** The table's spoken name. */
  readonly label: string;
  /** The list query. */
  readonly query: QueryRef;
  /** Fixed input (a relation's bound keys), sent with every read. */
  readonly input?: Readonly<Record<string, unknown>>;
  /** The recorded table; absent, the row's own keys are the columns. */
  readonly table?: TableNode | undefined;
  /** How many rows a page holds. */
  readonly pageSize: number;
  /** Whether the filter bar's search box is offered. */
  readonly searchable?: boolean;
  /** The actions of one row (its `id` is the record's public id). */
  readonly rowActions?: (
    row: Readonly<Record<string, unknown>> & { readonly id: string },
  ) => readonly ResourceAction[];
  /** The bulk bar's actions for the selected ids; absent, rows are not selectable. */
  readonly bulkActions?: (ids: readonly string[]) => readonly ResourceAction[];
  /** What an empty, unfiltered list shows. */
  readonly emptyState?: ReactElement;
  /** The saved view the table starts from: its columns, filter values and sort; the table's own when absent. */
  readonly view?: SavedView | undefined;
  /** The preset view the table starts from: its filter values and sort, and its fixed input on every read. */
  readonly preset?: ViewNode | undefined;
}
