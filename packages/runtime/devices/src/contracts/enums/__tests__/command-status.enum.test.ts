/**
 * Stackra file contract:
 * Purpose: unit tests of `CommandStatus`: the three wire codes in source order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0235 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CommandStatus } from "#contracts/enums/command-status.enum";

describe("CommandStatus", () => {
  it("has the three wire codes in source order", () => {
    expect(Enum.values(CommandStatus)).toEqual(["done", "failed", "rejected"]);
    expect(CommandStatus.Done).toBe("done");
  });

  it("types a value as one of its codes", () => {
    expectTypeOf<CommandStatus>().toEqualTypeOf<"done" | "failed" | "rejected">();
  });
});
