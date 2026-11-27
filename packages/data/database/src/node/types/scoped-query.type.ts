/**
 * Stackra file contract:
 * Purpose: `ScopedQuery`, the input of `queryInScope`: one query read as the app's role under an explicit tenant,
 *          with a row limit and a statement timeout.
 * Boundary: a type only; `scopedQueryInput` checks it.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); `.agents/rules/tenancy.md` (points 1 and 2); STA-2906.
 */

/** What `queryInScope` runs. */
export interface ScopedQuery {
  /** One query expression: `select …`, `with … select …`, `values …` or `table …`; a trailing `;` is dropped. */
  readonly sql: string;
  /** The tenant id the row-level security policies compare with (`app.tenant_id`), such as `scp_01j…`. */
  readonly scope: string;
  /**
   * The role to read as, when the connection's own role can bypass row-level security (a superuser test container):
   * the service's runtime role, such as `stackra_app`. Without it the connection's role is the app's role.
   */
  readonly role?: string | undefined;
  /** The most rows to return; 100 by default, at most 1000. */
  readonly limit?: number | undefined;
  /** The statement timeout in milliseconds; 5000 by default, from 100 to 30000. */
  readonly timeoutMs?: number | undefined;
  /** The environment, `process.env` by default (`inspectionTarget`). */
  readonly env?: Readonly<Record<string, string | undefined>> | undefined;
}
