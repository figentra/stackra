/**
 * Stackra file contract:
 * Purpose: `RowLevelSecurityOptions`, what `t.rowLevelSecurity(column, options)` takes: the transaction setting the
 *          generated policy reads and how the column matches it.
 * Boundary: a type only. `equals` is the column equal to the setting, cast to the column's type; `equalsOrUnset` is
 *           `equals`, and a null column also matches an unset or `''` setting (a nullable scope column, STA-1300);
 *           `ancestor` is an
 *           `ltree` column at or below one of the setting's `|`-separated paths; `inherited` is `ancestor` for reads and
 *           writes, and also shows the rows on the path above a granted path (the platform or product node's seeded
 *           templates), read only. `platform` is the platform form (ADR 0239 amendment, gap C): a set session reads
 *           its rows and the null rows and writes only its own; unset, a session reads and writes only the null rows.
 *           Each other match matches no row while the setting is unset or `''`.
 *           `restrictive` makes the policy `AS RESTRICTIVE`, a narrowing inside the one permissive policy, which does
 *           not narrow a session whose setting is unset or `''`.
 * Runtime: node
 * Governing contract: ADR 0239 (equality policy); ADR 0327 (decisions 3, 8 and 9); ADR 0347 (decisions 1 to 3:
 *                     one permissive policy, restrictive narrowing); ADR 0412 (inherited rows);
 *                     `.agents/rules/tenancy.md`.
 */

/** The setting and the match of one row-level-security policy. */
export interface RowLevelSecurityOptions {
  /** The custom setting the policy reads, `<prefix>.<name>` (`app.scope_paths`). */
  readonly setting: string;

  /**
   * `equals` for an id column; `equalsOrUnset` for a nullable id column whose null rows an unscoped session sees;
   * `platform` for the platform form of a nullable id column (ADR 0239 amendment, gap C): a set session reads its rows
   * and the null rows and writes only its own, a session with the setting unset reads and writes only the null rows;
   * with it come the restrictive `pol_<table>_<column>_write_update` and `_write_delete`, so neither command reaches a
   * row the session does not own;
   * `ancestor` for an `ltree` path column; `inherited` for an `ltree` path column whose rows
   * above the session's paths are read only to it.
   */
  readonly match: "equals" | "equalsOrUnset" | "platform" | "ancestor" | "inherited";

  /**
   * A restrictive policy (`AS RESTRICTIVE`, ADR 0347 d2 and d3): it can only narrow what the table's one permissive
   * policy shows, and a session with the setting unset or `''` is not narrowed. Not with `inherited`.
   */
  readonly restrictive?: boolean;

  /**
   * A column whose null rows this restrictive path policy also lets through when the row's path is an ancestor of, or
   * equal to, a granted path: the platform form's platform rows at the root and at the session's product node, never
   * another product's (`exemptNull: "tenant_id"` on the scope path of a platform-form table). Restrictive path
   * policies only.
   */
  readonly exemptNull?: string;
}
