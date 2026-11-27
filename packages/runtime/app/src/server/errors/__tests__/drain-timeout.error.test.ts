/**
 * Stackra file contract:
 * Purpose: unit tests of `DrainTimeoutError`: a plain error, not a refusal, carrying the count of calls still in
 *          flight and the deadline, with a message that names both and nothing else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0143 (decision 3: draining timeouts).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DrainTimeoutError } from "#server/errors/drain-timeout.error";

describe("DrainTimeoutError", () => {
  it("carries the calls still in flight and the deadline, and is not a refusal", () => {
    const error = new DrainTimeoutError(3, 20);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DrainTimeoutError");
    expect(error.pending).toBe(3);
    expect(error.timeoutSeconds).toBe(20);
    expect(error.message).toBe(
      "3 calls still in flight after the 20 s drain deadline; shutting down without them",
    );
    expect(isRefusal(error)).toBe(false);
  });

  it("names one call in the singular", () => {
    expect(new DrainTimeoutError(1, 5).message).toBe(
      "1 call still in flight after the 5 s drain deadline; shutting down without them",
    );
  });
});
