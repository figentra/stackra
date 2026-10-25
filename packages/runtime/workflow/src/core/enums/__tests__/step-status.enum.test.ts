/**
 * Stackra file contract:
 * Purpose: unit tests of `StepStatus`: the seven snake_case codes, in order, with `timed_out` for `TimedOut`, as the
 *          journal's check constraint and the template's run records read them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0102 (decision 1); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { StepStatus } from "#core/enums/step-status.enum";

describe("StepStatus", () => {
  it("lists the step statuses as snake_case codes", () => {
    expect(Enum.values(StepStatus)).toEqual([
      "running",
      "waiting",
      "done",
      "skipped",
      "failed",
      "timed_out",
      "compensated",
    ]);
    expect(`confirm:${StepStatus.TimedOut}`).toBe("confirm:timed_out");
  });

  it("types a value as one of the codes", () => {
    expectTypeOf<StepStatus>().toEqualTypeOf<
      "running" | "waiting" | "done" | "skipped" | "failed" | "timed_out" | "compensated"
    >();
  });
});
