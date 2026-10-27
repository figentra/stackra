/**
 * Stackra file contract:
 * Purpose: unit tests of `EcrOutcome`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231; ADR 0377.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EcrOutcome } from "#contracts/enums/ecr-outcome.enum";

describe("EcrOutcome", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(EcrOutcome)).toEqual(["approved", "declined", "cancelled", "pending"]);
  });
});
