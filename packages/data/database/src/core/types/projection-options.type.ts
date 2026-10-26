/**
 * Stackra file contract:
 * Purpose: `ProjectionOptions`, what `Projection<Source>({ key })` takes: the written key its rows are stored under.
 * Boundary: a type only; `Projection` checks and records the options, and the projection's own methods read them
 *           through `kindOf`. Which events feed the projection is the listeners' (their `handle` types), never an
 *           option here.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 5); ADR 0163 (decision 1: read models with
 *                     `asOf`).
 */

/** The options of a projection. */
export interface ProjectionOptions {
  /** The written key (`order_totals`, `reports.order_book`): snake_case words joined by dots. */
  readonly key: string;
}
