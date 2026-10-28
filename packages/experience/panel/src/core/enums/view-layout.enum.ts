/**
 * Stackra file contract:
 * Purpose: `ViewLayout`, how a saved view draws its rows: a table, a board grouped by a state field, a gallery of cards,
 *          a calendar placed by a date field, or a chart.
 * Boundary: an enum (`Enum.of`). Layouts are registered in code; a user picks one and never authors one. A board and a
 *           calendar name the row path they are laid out by (`SavedView.layoutBy`).
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decision 2: layouts); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A saved view's layout.
 *
 * @example
 * { layout: ViewLayout.Board, layoutBy: "status" }
 */
export const ViewLayout = Enum.of({
  /** Rows and columns; the default. */
  Table: "table",
  /** Cards grouped by a state field; a drag runs the state machine's transition action. */
  Board: "board",
  /** Cards from a registered card block. */
  Gallery: "gallery",
  /** Rows placed by a date field. */
  Calendar: "calendar",
  /** A registered chart type over the view's grouping and totals. */
  Chart: "chart",
});

/** One of the codes above. */
export type ViewLayout = Enum.Value<typeof ViewLayout>;
