/**
 * Stackra file contract:
 * Purpose: `ProjectionReadOptions`, what `get` and `list` of a projection take: the moment to read as of, and for
 *          `list` the keyset cursor and the page size.
 * Boundary: a type only. Without `asOf` a read returns the current versions.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 1: read models with `asOf`).
 */

/** How a projection is read. */
export interface ProjectionReadOptions {
  /** Read the versions in effect at this moment; the current ones when left out. */
  readonly asOf?: Date;

  /** `list` only: the record id to continue after (the last id of the previous page). */
  readonly after?: string;

  /** `list` only: the page size, 1 to 1,000; 100 by default. */
  readonly limit?: number;
}
