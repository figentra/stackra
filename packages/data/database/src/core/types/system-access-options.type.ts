/**
 * Stackra file contract:
 * Purpose: `SystemAccessOptions`, what `t.systemAccess` grants `SYSTEM_ACCESS_ROLE` on a tenant table: the columns a
 *          system lookup or claim reads, the columns a claim's lease writes, and why.
 * Boundary: a type only. Column names are literals of the table.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap A).
 */

/** The options of `Blueprint.systemAccess`. */
export interface SystemAccessOptions {
  /** The columns the role may read: the ids, the tenant column and what a claim filters and orders on. */
  readonly select: readonly string[];

  /** The columns a claim's lease writes (`leased_until`, `attempts`); none for a lookup. */
  readonly update?: readonly string[];

  /** Why a system reader needs the table before a tenant is known; required, one line. */
  readonly reason: string;
}
