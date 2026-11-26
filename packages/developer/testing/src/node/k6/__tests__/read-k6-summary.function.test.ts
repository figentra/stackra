/**
 * Stackra file contract:
 * Purpose: unit tests of `readK6Summary` on the shape k6 1.x exports: the request count, rate and failed share, the
 *          dropped iterations, the duration trend, crossed thresholds named as `<metric>: <expression>`, and zeros for
 *          a run that sent nothing.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-317.
 */
import { describe, expect, it } from "@stackra/testing";

import { readK6Summary } from "#node/k6/read-k6-summary.function";

/** A summary export as k6 1.3 writes it (trimmed to the metrics read). */
const SUMMARY = {
  root_group: {},
  metrics: {
    http_req_duration: {
      avg: 1.851707853,
      min: 0.601833,
      med: 1.468772,
      max: 5.129589,
      "p(90)": 3.727486,
      "p(95)": 4.074448,
      "p(99)": 5.0553102,
      thresholds: { "p(95)<50": false },
    },
    http_reqs: { count: 41, rate: 20.480959589 },
    http_req_failed: {
      passes: 1,
      fails: 40,
      value: 0.024390243,
      thresholds: { "rate<0.01": true },
    },
    dropped_iterations: { count: 3, rate: 1.5 },
    iterations: { count: 41, rate: 20.48 },
  },
};

describe("readK6Summary", () => {
  it("reads the requests, the failed share, the dropped iterations and the durations", () => {
    expect(readK6Summary(SUMMARY)).toEqual({
      passed: false,
      crossed: ["http_req_failed: rate<0.01"],
      requests: 41,
      rate: 20.481,
      failedRate: 0.024390243,
      dropped: 3,
      duration: { avg: 1.852, med: 1.469, p90: 3.727, p95: 4.074, p99: 5.055, max: 5.13 },
    });
  });

  it("passes when no threshold was crossed, and reads a run that sent nothing as zeros", () => {
    expect(readK6Summary({ metrics: { iterations: { count: 0 } } })).toEqual({
      passed: true,
      crossed: [],
      requests: 0,
      rate: 0,
      failedRate: 0,
      dropped: 0,
      duration: { avg: 0, med: 0, p90: 0, p95: 0, p99: 0, max: 0 },
    });
    expect(readK6Summary({}).passed).toBe(true);
  });
});
