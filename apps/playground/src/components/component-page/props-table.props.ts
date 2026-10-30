/**
 * Stackra file contract:
 * Purpose: `PropsTableProps`, props of one API table: its rows, its name and whether it has a Default column.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4 (row 9).
 */
import type { ApiProp } from "@stackra/showcase";

/** Props of `PropsTable`. */
export interface PropsTableProps {
  /** The table's accessible name. */
  readonly label: string;
  /** The props the table lists, one per row. */
  readonly rows: readonly ApiProp[];
  /** Render props have no Default column. */
  readonly hasDefault?: boolean | undefined;
}
