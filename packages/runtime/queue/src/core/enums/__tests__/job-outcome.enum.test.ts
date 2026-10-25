/**
 * Stackra file contract:
 * Purpose: unit tests of `JobOutcome`: the four ends of an attempt, as snake_case codes of an `Enum.of` value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 1); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JobOutcome } from "#core/enums/job-outcome.enum";

describe("JobOutcome", () => {
  it("lists the ends of an attempt", () => {
    expect(Enum.values(JobOutcome)).toEqual(["done", "retried", "dead_lettered", "dropped"]);
  });

  it("names the dead letter in snake_case", () => {
    expect(JobOutcome.DeadLettered).toBe("dead_lettered");
  });
});
