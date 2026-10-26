/**
 * Stackra file contract:
 * Purpose: the web `DataGrid` on HeroUI Pro's DataGrid: maps the contract's `label` to `aria-label` and passes every
 *          other HeroUI Pro prop (columns, sorting, selection, resizing, tree rows, virtualisation) through unchanged.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. Imports the `data-grid`
 *          subpath so the other Pro components stay out of the bundle.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); owner decision 6 of STA-350 (thin wrappers);
 *          STA-403 FR-003.
 */
import { DataGrid as HeroDataGrid } from "@heroui-pro/react/data-grid";

import type { DataGridProps } from "#react/data-grid/data-grid.props";

/**
 * A data grid on HeroUI Pro: sortable, selectable, resizable columns, row reorder, tree rows and virtualisation,
 * named for assistive technology by `label`.
 */
export function DataGrid<T extends object>({ label, ...rest }: DataGridProps<T>) {
  return <HeroDataGrid<T> {...rest} aria-label={label} />;
}

export type {
  DataGridColumn,
  DataGridColumnSize,
  DataGridReorderEvent,
  DataGridSelection,
  DataGridSortDescriptor,
  DataGridSortDirection,
} from "@heroui-pro/react/data-grid";
