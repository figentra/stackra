/**
 * Stackra file contract:
 * Purpose: `PolicyRow`, one `pg_policy` row of a table as `assertRowSecurity` reads it for `policyGaps`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0347 (decision 5).
 */

/** One `pg_policy` row of a table. */
export interface PolicyRow {
  readonly name: string;
  readonly permissive: boolean;
  /** `polcmd`: `*` for `FOR ALL`, else `r`, `a`, `w` or `d`. */
  readonly command: string;
  /** The `USING` expression, '' when none. */
  readonly using: string;
  /** The `WITH CHECK` expression, '' when none. */
  readonly check: string;
}
