/**
 * Stackra file contract:
 * Purpose: `TableColumnSpec`, the server-driven shape of one table column and the table's own flags: the row path, the
 *          header, alignment and widths, the pinned edge, wrapping, resizing, the row header, start hidden, hideable,
 *          inline edit, the footer aggregate, how the cell renders and its tones per value, and the sticky header,
 *          column tools and resize handles of the whole table.
 * Boundary: a type only; data. A recorded column (`ColumnNode`) carries the per-column fields but `id` (its `key`) and
 *           `isHidden` (its `hidden`); the table (`TableNode`) carries `isStickyHeader`, `hasColumnTools` and
 *           `isColumnResizable`. A width as a string is kept but only a number reaches the table.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 13); ADR 0504; the SDUI catalogue case `tableColumns` (STA-1981).
 */
import type { Tone } from "@stackra/contracts";
import type { AggregateKind, ColumnPin } from "@stackra/ui/contracts";

/** One table column, as data. */
export interface TableColumnSpec {
  /** The row path the column shows. */
  readonly id: string;
  /** The header; absent, the derived i18n key. */
  readonly label?: string | undefined;
  /** How the cells line up. */
  readonly align?: "start" | "center" | "end" | undefined;
  /** The width, in CSS pixels. */
  readonly width?: number | string | undefined;
  /** The narrowest a resize may make it. */
  readonly minWidth?: number | undefined;
  /** The widest a resize may make it. */
  readonly maxWidth?: number | undefined;
  /** The edge it sticks to while the rows scroll sideways. */
  readonly pin?: ColumnPin | undefined;
  /** True to wrap long text, false to cut it. */
  readonly wrap?: boolean | undefined;
  /** False to keep the resize handle away. */
  readonly isResizable?: boolean | undefined;
  /** True for the cell that names the row. */
  readonly isRowHeader?: boolean | undefined;
  /** True to start hidden but choosable. */
  readonly isHidden?: boolean | undefined;
  /** False to keep the column always shown. */
  readonly isHideable?: boolean | undefined;
  /** True to edit the cell in place, through the resource's update action. */
  readonly isEditable?: boolean | undefined;
  /** The footer aggregate. */
  readonly aggregate?: AggregateKind | undefined;
  /** How the cell renders. Defaults to `text`, the value formatted for its kind. */
  readonly cell?:
    | "text"
    | "badge"
    | "status"
    | "money"
    | "principal"
    | "date"
    | "link"
    | "copy"
    | undefined;
  /** The tone of a badge or status cell per value. */
  readonly tones?: Readonly<Record<string, Tone>> | undefined;
  /** True to keep the header in view while the rows scroll. */
  readonly isStickyHeader?: boolean | undefined;
  /** True to give each header the column tools. */
  readonly hasColumnTools?: boolean | undefined;
  /** True to give each header a resize handle. */
  readonly isColumnResizable?: boolean | undefined;
}
