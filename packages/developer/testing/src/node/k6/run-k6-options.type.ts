/**
 * Stackra file contract:
 * Purpose: `RunK6Options`, one k6 run: the target's base URL, the scenario it posts to, the load and the thresholds
 *          that fail the run, and the k6 binary when it is not the one on PATH.
 * Boundary: type only; `runK6` and `k6Args` read it.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import type { K6Load } from "#node/k6/k6-load.type";

/** One k6 run against a load target. */
export type RunK6Options = {
  /** The target's base URL (`LoadTarget.url`, or a deployed service's). */
  readonly target: string;

  /** The scenario it posts to: `POST <target>/scenarios/<scenario>`. */
  readonly scenario: string;

  /** How hard and how long. */
  readonly load: K6Load;

  /**
   * k6 thresholds by metric, such as `{ http_req_failed: ["rate<0.001"], http_req_duration: ["p(95)<50"] }`; a crossed
   * one fails the run (k6 exits 99).
   */
  readonly thresholds?: Readonly<Record<string, readonly string[]>>;

  /** The k6 binary; `k6Binary()` when omitted. */
  readonly k6?: string;
};
