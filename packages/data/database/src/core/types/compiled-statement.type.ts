/**
 * Stackra file contract:
 * Purpose: `CompiledStatement`, one statement of a transactional step with the statements that undo it.
 * Boundary: internal data of the migration compiler; never exported from the entry. An empty inverse means the
 *           statement is undone by an earlier statement's inverse (a comment by its table's drop).
 * Runtime: node
 * Governing contract: ADR 0159 (2026-10-23 note: gen derives the inverse of every step).
 */

/** One statement and its inverse. */
export interface CompiledStatement {
  /** The statement. */
  readonly sql: string;

  /** What undoes it, or `false` when nothing can. */
  readonly inverse: readonly string[] | false;
}
