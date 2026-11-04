/**
 * Stackra file contract:
 * Purpose: `ResourceTableProps`, the props of the native List page's data table.
 * Boundary: props only; internal to the native resource pages.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 1, 2 and 11); ADR 0164; ADR 0271 (decisions 1 and 7); ADR 0505.
 */
import type { QueryRef } from "@stackra/clients";
import type { ResourceAction } from "@stackra/ui/contracts";
import type { ReactElement } from "react";

import type { ViewStore } from "#core/ports/view-store.port";
import type { TableNode } from "#core/types/table-node.type";
import type { ViewNode } from "#core/types/view-node.type";

/** Props of the native `ResourceTable`. */
export interface ResourceTableProps {
  /** The resource key whose labels the columns and filters take. */
  readonly resourceKey: string;
  /** The table's spoken name. */
  readonly label: string;
  /** The list query. */
  readonly query: QueryRef;
  /** The recorded table; absent, the row's own keys are the columns. */
  readonly table?: TableNode | undefined;
  /** How many rows a page holds. */
  readonly pageSize: number;
  /** The actions of one row (its `id` is the record's public id). */
  readonly rowActions?: (
    row: Readonly<Record<string, unknown>> & { readonly id: string },
  ) => readonly ResourceAction[];
  /** The bulk bar's actions for the selected ids; absent, rows are not selectable. */
  readonly bulkActions?: (ids: readonly string[]) => readonly ResourceAction[];
  /** What an empty, unfiltered list shows. */
  readonly emptyState?: ReactElement;
  /** Where the viewer's saved views are read; given, they draw as tabs over the table. */
  readonly views?: ViewStore | undefined;
  /** The resource's preset views: tabs whose filter values and sort the table takes, and whose fixed input goes with every read. */
  readonly presets?: readonly ViewNode[] | undefined;
}
