/**
 * Stackra file contract:
 * Purpose: `INSPECTION_LIMITS`, the bounds of a developer database inspection: the rows `queryInScope` returns by
 *          default and at most, its statement timeout by default and at most, the longest query text and tenant id
 *          it takes, and the environments any inspection may read (`dev`, local; `test`, the testbed).
 * Boundary: data only; `queryInScope`, `inspectionTarget` and the `stackra db:*` commands read it.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); STA-2906.
 */

/** The bounds of an inspection. */
export const INSPECTION_LIMITS = {
  /** Rows a query returns when the caller names no limit. */
  defaultRows: 100,
  /** The most rows a query returns. */
  maxRows: 1000,
  /** The statement timeout of a query when the caller names none, in milliseconds. */
  defaultTimeoutMs: 5000,
  /** The shortest statement timeout, in milliseconds. */
  minTimeoutMs: 100,
  /** The longest statement timeout, in milliseconds. */
  maxTimeoutMs: 30_000,
  /** The longest query text, in characters. */
  maxSqlLength: 20_000,
  /** The environments an inspection reads: local dev and the testbed, never a deployed one. */
  environments: ["dev", "test"],
} as const;
