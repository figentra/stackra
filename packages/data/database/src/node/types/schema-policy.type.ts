/**
 * Stackra file contract:
 * Purpose: `SchemaPolicy`, one row-level security policy of a `SchemaTable`: its name, command, kind, roles and
 *          expressions.
 * Boundary: a type only; plain JSON values.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); `.agents/rules/tenancy.md` (point 2); STA-2906.
 */

/** One row-level security policy of a table. */
export interface SchemaPolicy {
  /** The policy name. */
  readonly name: string;
  /** `ALL`, `SELECT`, `INSERT`, `UPDATE` or `DELETE`. */
  readonly command: string;
  /** Whether it is permissive (OR-ed) rather than restrictive (AND-ed). */
  readonly permissive: boolean;
  /** The roles it applies to (`public` for every role). */
  readonly roles: readonly string[];
  /** Its USING expression, or null. */
  readonly using: string | null;
  /** Its WITH CHECK expression, or null. */
  readonly check: string | null;
}
