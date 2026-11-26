/**
 * Stackra file contract:
 * Purpose: `RolePolicyRow`, one `pg_policy` row with its schema, table and the roles it applies to, as
 *          `assertRowSecurity` reads it for the system-access checks.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0347 (decision 5); ADR 0239 (2026-11-07 amendment, gap A).
 */
import type { PolicyRow } from "#testing/types/policy-row.type";

/** One `pg_policy` row of a table, with its roles. */
export interface RolePolicyRow extends PolicyRow {
  /** The schema of the policy's table. */
  readonly schema: string;
  /** The table the policy is on. */
  readonly table: string;
  /** The role names it applies to, comma-joined and sorted; `public` when it names none. */
  readonly roles: string;
}
