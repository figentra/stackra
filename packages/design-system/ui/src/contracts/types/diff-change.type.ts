/**
 * Stackra file contract:
 * Purpose: `DiffChange`, one change of a change set: what changes, and its value before and after.
 * Boundary: types only. Values are already formatted text; null means not set.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** One reviewed change. */
export interface DiffChange {
  /** A stable id, the key of its decision. */
  readonly id: string;
  /** What changes: "Price", "Shipping zone". */
  readonly label: string;
  /** The value before the change; null when it is added. */
  readonly before: string | null;
  /** The value after the change; null when it is removed. */
  readonly after: string | null;
}
