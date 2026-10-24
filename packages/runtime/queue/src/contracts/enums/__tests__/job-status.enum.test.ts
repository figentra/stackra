/**
 * Stackra file contract:
 * Purpose: unit tests of `JobStatus`: the three codes of the `status` column, in order, as an `Enum.of` value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { JobStatus } from "#contracts/enums/job-status.enum";

describe("JobStatus", () => {
  it("lists the stored states in order", () => {
    expect(Enum.values(JobStatus)).toEqual(["waiting", "running", "dead"]);
  });

  it("names each case", () => {
    expect(JobStatus.Waiting).toBe("waiting");
    expect(JobStatus.Running).toBe("running");
    expect(JobStatus.Dead).toBe("dead");
    expectTypeOf<JobStatus>().toEqualTypeOf<"waiting" | "running" | "dead">();
  });
});
