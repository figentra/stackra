/**
 * Stackra file contract:
 * Purpose: `BackfillQuery`, how a backfill runs one SQL statement on its session and reads its rows.
 * Boundary: a type only; SQL text without parameters (the runner quotes every value it builds in).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs).
 */

/** Runs one statement and returns its rows. */
export type BackfillQuery = (sql: string) => Promise<readonly Record<string, unknown>[]>;
