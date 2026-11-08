/**
 * Stackra file contract:
 * Purpose: `RowSecurityDeclaration`, one `t.platformTable(reason)` or `t.reviewedPolicy(reason, policies)` call found
 *          in a migration, as `rowSecurityDeclarations` reads it.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table).
 */

/** One declaration in a migration file. */
export interface RowSecurityDeclaration {
  /** The migration file, repository-relative. */
  readonly file: string;

  /** The table of the `schema.create`/`schema.table` block the call is in. */
  readonly table: string;

  /** Which declaration it is. */
  readonly kind: "platformTable" | "reviewedPolicy";

  /** The reason as written, or undefined when it is not a plain string literal. */
  readonly reason: string | undefined;

  /** The policies a review names, as written; empty for a platform table. */
  readonly policies: readonly string[];
}
