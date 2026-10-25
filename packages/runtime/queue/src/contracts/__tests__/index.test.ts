/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the `QueueDriver` port and the `JobStatus` enum are its
 *          only values, and the `QueuedJob` and `JobError` types travel with them.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/queue/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["JobStatus", "QueueDriver"]);
  });

  it("types a stored job's failure", () => {
    expectTypeOf<contracts.QueuedJob["lastError"]>().toEqualTypeOf<
      contracts.JobError | undefined
    >();
    expectTypeOf<contracts.JobError>().toEqualTypeOf<{
      readonly code: string;
      readonly message: string;
    }>();
  });
});
