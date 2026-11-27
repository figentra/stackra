/**
 * Stackra file contract:
 * Purpose: `LatencySummary`, what a load target measured of one scenario on the server side: how many runs it served,
 *          how many failed, the first failure's message and the run times at the median, p95, p99 and the slowest.
 * Boundary: type only; `summariseLatencies` builds it and `LoadTarget.latency` returns it.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */

/** The server-side latency of one scenario, in milliseconds. */
export type LatencySummary = {
  /** Runs that resolved. */
  readonly served: number;

  /** Runs that threw. */
  readonly failed: number;

  /** The message of the first run that threw, when one did. */
  readonly firstError?: string;

  /** The median run time of the runs that resolved; 0 when none did. */
  readonly p50: number;

  /** The 95th percentile. */
  readonly p95: number;

  /** The 99th percentile. */
  readonly p99: number;

  /** The slowest run. */
  readonly max: number;
};
