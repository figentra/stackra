/**
 * Stackra file contract:
 * Purpose: unit tests of `runOfCall`: a step key (and a for-each item's key) names its run; any other call id, or
 *          none, names no run.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0141 (correlation); OS-232 (chain depth).
 */
import { describe, expect, it } from "@stackra/testing";

import { runOfCall } from "#core/functions/run-of-call.function";

const RUN = "wfr_01jb6z3q0m4v9tbn1xg5rd2hc8";

describe(runOfCall, () => {
  it("reads the run of a step key and of a for-each item's key", () => {
    expect(runOfCall(`${RUN}:notify`)).toBe(RUN);
    expect(runOfCall(`${RUN}:notify:3`)).toBe(RUN);
  });

  it("names no run for another call id or none", () => {
    for (const callId of [undefined, "evt_1", RUN, "call-1", `wfr_short:notify`])
      expect(runOfCall(callId)).toBeUndefined();
  });
});
