/**
 * Stackra file contract:
 * Purpose: `PostgresWrite`, a row write kind a database fault can strike: an insert, an update or a delete.
 * Boundary: a public type of the `.` entry; `PostgresFaultOptions.on` lists them.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection; decision 3: Postgres in the integration tier).
 */

/** A row write kind a database fault can strike. */
export type PostgresWrite = "insert" | "update" | "delete";
