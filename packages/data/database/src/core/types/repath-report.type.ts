/**
 * Stackra file contract:
 * Purpose: `RepathReport`, what one model's re-path did when its scope subtree moved: how many rows took the new path.
 * Boundary: a type only, counts only.
 * Runtime: isomorphic
 * Governing contract: ADR 0411 (subtree move).
 */

/** One model's re-path. */
export interface RepathReport {
  /** The model's class name. */
  readonly model: string;

  /** The rows whose `scope_path` moved from the old prefix to the new one. */
  readonly rows: number;
}
