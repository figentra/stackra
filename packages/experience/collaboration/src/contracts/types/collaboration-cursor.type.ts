/**
 * Stackra file contract:
 * Purpose: `CollaborationCursor`, where one peer's pointer is on the editing surface.
 * Boundary: a type only, in the leaf entry. Coordinates are in the surface's own space (the canvas or grid the builder
 *           draws), so every peer renders them the same at any zoom. A text caret inside a co-edited document is part
 *           of the shared document, not a cursor.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 6: cursors for full collaboration); ADR 0225 (decision 2).
 */

/** A pointer position. */
export interface CollaborationCursor {
  /** Horizontal position in surface units. */
  readonly x: number;

  /** Vertical position in surface units. */
  readonly y: number;
}
