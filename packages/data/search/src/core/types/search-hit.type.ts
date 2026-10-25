/**
 * Stackra file contract:
 * Purpose: `SearchHit`, one result of `Search.across`: the model the row belongs to and the loaded row.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 4 and 6: the palette and the search API).
 */
import type { AnyClass } from "@stackra/container";

/** One row of a global search. */
export interface SearchHit {
  /** The row's model. */
  readonly model: AnyClass;

  /** The loaded row. */
  readonly row: object;
}
