/**
 * Stackra file contract:
 * Purpose: the native `Table` compound on HeroUI Native Pro's Table (a scrollable table with sorting and
 *          selection): the root and the parts Background, ScrollContainer, Content, Header, Column, Body, Row, Cell,
 *          SelectAllCell, SelectionCell and Footer, with HeroUI Native Pro's own names; `useTable`, `useTableState`,
 *          `useTableColumn` and `useTableRow` read the table, column and row a part sits in.
 * Boundary: every prop passes through unchanged. HeroUI Native Pro's Table finds its columns, rows and cells by
 *          element type, to number them and inject their state, so a wrapper around one of them would stop that;
 *          `variant` is the emphasis (`primary` or `secondary`), not a colour, so it keeps its name. The compound
 *          exposes the parts of HeroUI Native Pro, its own components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { Table as HeroTable } from "heroui-native-pro/table";
import type { ReactElement } from "react";
import type { TableProps } from "#native/table/table.props";

/** The root: HeroUI Native Pro's, which holds the sort and selection state. */
function TableRoot(props: TableProps): ReactElement {
  return <HeroTable {...props} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface TableParts {
  /** The theme-aware background layer behind the table. */
  readonly Background: typeof HeroTable.Background;
  /** The horizontal scroll view around the content. */
  readonly ScrollContainer: typeof HeroTable.ScrollContainer;
  /** The box that holds the header, body and footer. */
  readonly Content: typeof HeroTable.Content;
  /** The header row. */
  readonly Header: typeof HeroTable.Header;
  /** One column header, sortable by its `id`. */
  readonly Column: typeof HeroTable.Column;
  /** The body, drawn from `items` or from `Table.Row` children. */
  readonly Body: typeof HeroTable.Body;
  /** One row. */
  readonly Row: typeof HeroTable.Row;
  /** One cell. */
  readonly Cell: typeof HeroTable.Cell;
  /** The header cell with the select-all checkbox. */
  readonly SelectAllCell: typeof HeroTable.SelectAllCell;
  /** The row cell with the selection checkbox. */
  readonly SelectionCell: typeof HeroTable.SelectionCell;
  /** The footer, for totals or paging. */
  readonly Footer: typeof HeroTable.Footer;
}

/** A table: `Table.Header` holds `Column`s, `Table.Body` holds `Row`s of `Cell`s, then an optional `Footer`. */
export const Table: typeof TableRoot & TableParts = Object.assign(TableRoot, {
  Background: HeroTable.Background,
  ScrollContainer: HeroTable.ScrollContainer,
  Content: HeroTable.Content,
  Header: HeroTable.Header,
  Column: HeroTable.Column,
  Body: HeroTable.Body,
  Row: HeroTable.Row,
  Cell: HeroTable.Cell,
  SelectAllCell: HeroTable.SelectAllCell,
  SelectionCell: HeroTable.SelectionCell,
  Footer: HeroTable.Footer,
});

export { useTable, useTableColumn, useTableRow, useTableState } from "heroui-native-pro/table";
