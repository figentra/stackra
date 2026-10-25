/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RetryOn`: its two policies and the type of the same name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (decision 3).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RetryOn } from "#server/enums/retry-on.enum";

describe("RetryOn", () => {
  it("has the network and retryable policies", () => {
    expect(Enum.values(RetryOn)).toEqual(["network", "retryable"]);
    expectTypeOf<RetryOn>().toEqualTypeOf<"network" | "retryable">();
  });
});
