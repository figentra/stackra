/**
 * Stackra file contract:
 * Purpose: `D1Database`: the D1 database binding.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */
import type { D1Statement } from "#src/interfaces/d1-statement.interface";

/** The D1 database binding. */
export interface D1Database {
  /** Prepares one SQL statement for binding and running. */
  prepare(sql: string): D1Statement;
  /** Runs several prepared statements in one transaction. */
  batch(statements: D1Statement[]): Promise<unknown[]>;
}
