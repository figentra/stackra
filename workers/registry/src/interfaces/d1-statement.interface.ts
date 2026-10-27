/**
 * Stackra file contract:
 * Purpose: `D1Statement`: A prepared D1 statement.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** A prepared D1 statement. */
export interface D1Statement {
  bind(...values: readonly (string | number | null)[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
