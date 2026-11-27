/**
 * Stackra file contract:
 * Purpose: `ScopedQueryResult`, what `queryInScope` answers: the environment, role and tenant it ran as, the columns,
 *          the rows and whether the limit cut them.
 * Boundary: a type only; plain JSON values (`queryInScope` turns bigints, dates and bytes into strings), so it is the
 *           `--json` document of `stackra db:query` and the MCP tool's structured result.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); `.agents/rules/tenancy.md` (points 1 and 2); STA-2906.
 */

/** What `queryInScope` answers. */
export interface ScopedQueryResult {
  /** The environment it read (`dev` or `test`). */
  readonly environment: string;
  /** The role the query ran as. */
  readonly role: string;
  /** The tenant it ran under. */
  readonly scope: string;
  /** The column names, in order; empty when no row came back. */
  readonly columns: readonly string[];
  /** The rows, at most `limit`. */
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  /** How many rows came back. */
  readonly rowCount: number;
  /** Whether more rows matched than `limit`. */
  readonly truncated: boolean;
  /** The limit it applied. */
  readonly limit: number;
}
