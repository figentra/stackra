/**
 * Stackra file contract:
 * Purpose: `RowLevelSecurityOptions`, what `t.rowLevelSecurity(column, options)` takes: the transaction setting the
 *          generated policy reads and how the column matches it.
 * Boundary: a type only. `equals` is the column equal to the setting, cast to the column's type; `ancestor` is an
 *           `ltree` column at or below one of the setting's `|`-separated paths; `inherited` is `ancestor` for reads and
 *           writes, and also shows the rows on the path above a granted path (the platform or product node's seeded
 *           templates), read only. Each matches no row while the setting is unset or `''`.
 * Runtime: node
 * Governing contract: ADR 0239 (equality policy); ADR 0327 (decisions 3, 8 and 9); ADR 0412 (inherited rows);
 *                     `.agents/rules/tenancy.md`.
 */

/** The setting and the match of one row-level-security policy. */
export interface RowLevelSecurityOptions {
  /** The custom setting the policy reads, `<prefix>.<name>` (`app.scope_paths`). */
  readonly setting: string;

  /**
   * `equals` for an id column; `ancestor` for an `ltree` path column; `inherited` for an `ltree` path column whose rows
   * above the session's paths are read only to it.
   */
  readonly match: "equals" | "ancestor" | "inherited";
}
