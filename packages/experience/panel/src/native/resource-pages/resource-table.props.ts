/**
 * Stackra file contract:
 * Purpose: `ResourceTableProps`, the props of the native List page's data table.
 * Boundary: props only; internal to the native resource pages. The web table's props but the fixed input, the
 *           search-only filter bar and inline cell edits, which a phone does not offer.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 1, 2 and 11); ADR 0164; ADR 0271 (decisions 1 and 7); ADR 0505.
 */
import type { ResourceTableProps as WebResourceTableProps } from "#react/resource-pages/resource-table.props";

/** Props of the native `ResourceTable`. */
export type ResourceTableProps = Omit<WebResourceTableProps, "input" | "searchable" | "onCellEdit">;
