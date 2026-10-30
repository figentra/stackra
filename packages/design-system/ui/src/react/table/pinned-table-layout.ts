/**
 * Stackra file contract:
 * Purpose: `PinnedTableLayout`, React Aria's `TableLayout` for the web Table's virtualised rows, with the columns marked
 *          `data-sticky` (the drag handles, the selection boxes and the columns pinned to the start) kept stuck at the
 *          start while the rows scroll sideways, as React Aria does for its own selection column.
 * Boundary: a layout only: it marks the header and the cells of those columns sticky, lets the header's and the row
 *           group's boxes overflow (a clipping box would trap the sticky cells), and leaves every size to React
 *           Aria. A column pinned to the end is not stuck in a virtualised table (React Aria's sticky cells flow from
 *           the start), so it scrolls with the rest there.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 4 (virtual scrolling keeps the sticky header and
 *          the pinned columns); ADR 0165 (React Aria on web); STA-1371.
 */
import { TableLayout } from "react-aria-components";

/** The column or cell node React Aria asks about: a column carries its own props; a cell, the index of its column. */
interface LayoutNodeLike {
  readonly type: string;
  readonly index: number;
  readonly colIndex?: number | null;
  readonly props?: unknown;
}

/** React Aria's table layout, with the `data-sticky` columns stuck to the start. */
export class PinnedTableLayout<T> extends TableLayout<T> {
  /**
   * Builds the row group with overflow allowed, so its sticky cells stick to the table's own scroll area.
   *
   * The row group's box clips by default, which makes it the scroll box its sticky cells stick to; the body still
   * clips its corners itself.
   */
  protected override buildRowGroup(
    ...args: Parameters<TableLayout<T>["buildRowGroup"]>
  ): ReturnType<TableLayout<T>["buildRowGroup"]> {
    const node = super.buildRowGroup(...args);
    node.layoutInfo.allowOverflow = true;
    return node;
  }

  /** Builds the header with overflow allowed, so its sticky column headers stay in view. */
  protected override buildTableHeader(): ReturnType<TableLayout<T>["buildTableHeader"]> {
    const node = super.buildTableHeader();
    node.layoutInfo.allowOverflow = true;
    return node;
  }

  /** Tells whether a column, or the column of a cell, is marked `data-sticky`. */
  protected override isStickyColumn(node: LayoutNodeLike): boolean {
    const column =
      node.type === "column" ? node : this.collection.columns[node.colIndex ?? node.index];
    const props = column?.props as Readonly<Record<string, unknown>> | undefined;
    return props?.["data-sticky"] === true;
  }
}
