/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayLockedError`: it names the environment and tells the operator to run again.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0435.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayLockedError } from "#core/errors/runway-locked.error";

describe("RunwayLockedError", () => {
  it("names the environment", () => {
    const error = new RunwayLockedError("production");

    expect(error.name).toBe("RunwayLockedError");
    expect(error.environment).toBe("production");
    expect(error.message).toBe("Another apply is running in production; run again once it ends");
  });
});
