/**
 * Stackra file contract:
 * Purpose: `K6Load`, how hard and how long k6 drives a scenario: an open model (a fixed arrival rate, the soak shape,
 *          where a slow subject shows as dropped iterations instead of a slower request rate) or a closed one (a fixed
 *          number of virtual users looping, the shape that finds the ceiling).
 * Boundary: type only; `runK6` hands it to k6 as the scenario's executor.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */

/** A k6 executor and its settings; `duration` is a k6 duration such as `"30s"` or `"1h"`. */
export type K6Load =
  | {
      readonly executor: "constant-arrival-rate";
      /** Iterations started per second. */
      readonly rate: number;
      readonly duration: string;
      /** Virtual users allocated before the run. */
      readonly preAllocatedVUs: number;
      /** The most virtual users k6 may add when the subject slows; `preAllocatedVUs` when omitted. */
      readonly maxVUs?: number;
    }
  | {
      readonly executor: "constant-vus";
      /** Virtual users, each running iterations back to back. */
      readonly vus: number;
      readonly duration: string;
    };
