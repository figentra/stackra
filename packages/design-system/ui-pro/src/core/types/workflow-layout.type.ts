/**
 * Stackra file contract:
 * Purpose: `WorkflowLayout`, where each node of a `WorkflowCanvas` sits (its column and its row in it) and how many
 *          columns and rows the grid has.
 * Boundary: internal type; `workflowLayout` returns it and the web canvas reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); OS-230 (graph canvas).
 */

/** The layout of a workflow graph. */
export interface WorkflowLayout {
  /** Each node's column (`layer`) and row in it, by id. */
  readonly placements: ReadonlyMap<string, { readonly layer: number; readonly row: number }>;
  /** How many columns. */
  readonly layers: number;
  /** How many rows the tallest column has. */
  readonly rows: number;
}
