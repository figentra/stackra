/**
 * Stackra file contract:
 * Purpose: `MigrationTarget`, where `checkMigrations` runs a member's compiled migrations: anything that executes a
 *          SQL text of several statements (PGlite's `exec`, or a Postgres connection's `execute` in the gate).
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0159; STA-1689.
 */

/** A database that runs a SQL text. */
export interface MigrationTarget {
  /** Runs `sql`, which may hold several statements. */
  readonly exec: (sql: string) => Promise<unknown>;
}
