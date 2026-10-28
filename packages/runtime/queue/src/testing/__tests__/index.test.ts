/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: `drainQueue` and `runJob` (which the template's tests
 *          import) are exported with the `toDeadLetter` matcher and the testing-module plugin, and nothing else is a
 *          value; importing the entry registers the matcher.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/queue/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "QUEUE_CONFORMANCE_CASES",
      "QUEUE_TESTING_PLUGIN",
      "drainQueue",
      "runJob",
      "runQueueConformance",
      "toDeadLetter",
    ]);
  });

  it("registers toDeadLetter with expect", () => {
    expect(typeof expect({}).toDeadLetter).toBe("function");
  });
});
