/**
 * Stackra file contract:
 * Purpose: `RowSecurityDeclaration`, one `t.platformTable(reason)`, `t.reviewedPolicy(reason, policies)`,
 *          `t.systemAccess({ select, update, reason })` or `schema.systemFunction({ name, ..., reason })` call found in a
 *          migration, as `rowSecurityDeclarations` reads it.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table and gap A).
 */

/** One declaration in a migration file. */
export interface RowSecurityDeclaration {
  /** The migration file, repository-relative. */
  readonly file: string;

  /**
   * The table of the `schema.create`/`schema.table` block the call is in; for a `systemFunction`, the function's
   * `name`.
   */
  readonly table: string;

  /** Which declaration it is. */
  readonly kind: "platformTable" | "reviewedPolicy" | "systemAccess" | "systemFunction";

  /** The reason as written, or undefined when it is not a plain string literal. */
  readonly reason: string | undefined;

  /** The policies a review names, as written; empty for the other kinds. */
  readonly policies: readonly string[];

  /** The grants a system access names, as written (`select id`, `update leased_until`); empty for the other kinds. */
  readonly columns: readonly string[];
}
