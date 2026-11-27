/**
 * Stackra file contract:
 * Purpose: unit tests of `finishSteps`: `stackra gen`, then `stackra gen --check`, then the tests, run through the
 *          `test` tool when the server has one and through `verify` otherwise.
 * Boundary: test only; pure input.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2919.
 */
import { describe, expect, it } from "@stackra/testing";

import { finishSteps } from "#node/functions/finish-steps.function";

describe("finishSteps", () => {
  it("runs the tests through verify when the server has no test tool", () => {
    const steps = finishSteps(new Set(["gen", "verify"]));

    expect(steps.split("\n").slice(0, 3)).toEqual([
      expect.stringContaining("Run `stackra gen` (the `gen` tool)"),
      expect.stringContaining("Run `stackra gen --check`"),
      expect.stringContaining("the `verify` tool (`stackra verify`"),
    ]);
  });

  it("runs the tests through the test tool when the server has one", () => {
    expect(finishSteps(new Set(["gen", "test", "verify"]))).toContain(
      "3. Run the tests with the `test` tool.",
    );
  });
});
