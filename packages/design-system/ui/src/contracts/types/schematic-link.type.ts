/**
 * Stackra file contract:
 * Purpose: `SchematicLink`, one pipe of a `Schematic`: from the bottom centre of one named node to the top centre of
 *          another.
 * Boundary: types only. The names are `SchematicNode` ids, never shown.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0501 (section 9, the blueprint roles); STA-2041.
 */

/** One pipe between two schematic nodes. */
export interface SchematicLink {
  /** The id of the node the pipe leaves. */
  readonly from: string;
  /** The id of the node the pipe reaches. */
  readonly to: string;
}
