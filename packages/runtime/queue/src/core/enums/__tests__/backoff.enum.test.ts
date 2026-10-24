/**
 * Stackra file contract:
 * Purpose: unit tests of `Backoff`: the three retry waits, exponential first (the default), as an `Enum.of` value.
 * Boundary: test only; the waits themselves are `backoffDelay`'s tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Backoff } from "#core/enums/backoff.enum";

describe("Backoff", () => {
  it("lists the retry waits", () => {
    expect(Enum.values(Backoff)).toEqual(["exponential", "linear", "fixed"]);
  });

  it("is the code the template writes in a job option", () => {
    expect(Backoff.Exponential).toBe("exponential");
    expectTypeOf<Backoff>().toEqualTypeOf<"exponential" | "linear" | "fixed">();
  });
});
