/**
 * Stackra file contract:
 * Purpose: `K6Result`, what one k6 run measured from the client side: whether every threshold held (and which ones
 *          were crossed), the requests and their rate, the failed share, the iterations an arrival-rate run could not
 *          start, and the request durations.
 * Boundary: type only; `readK6Summary` builds it from k6's summary export.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */

/** One k6 run, as its summary export reports it; durations in milliseconds. */
export type K6Result = {
  /** Every threshold held. */
  readonly passed: boolean;

  /** Each crossed threshold as `<metric>: <expression>`. */
  readonly crossed: readonly string[];

  /** Requests sent. */
  readonly requests: number;

  /** Requests per second over the run. */
  readonly rate: number;

  /** The share of requests that failed (a status of 400 or more, or no answer), 0 to 1. */
  readonly failedRate: number;

  /** Iterations an arrival-rate run had to drop because every virtual user was busy: the subject fell behind. */
  readonly dropped: number;

  /** The request durations k6 saw, loopback hop included. */
  readonly duration: {
    readonly avg: number;
    readonly med: number;
    readonly p90: number;
    readonly p95: number;
    readonly p99: number;
    readonly max: number;
  };
};
