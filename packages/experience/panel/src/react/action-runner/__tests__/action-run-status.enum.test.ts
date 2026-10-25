/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ActionRunStatus`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";

describe("ActionRunStatus", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(ActionRunStatus)).toEqual(["done", "cancelled", "refused"]);
  });

  it("types its values", () => {
    expectTypeOf<ActionRunStatus>().toEqualTypeOf<"done" | "cancelled" | "refused">();
  });
});
