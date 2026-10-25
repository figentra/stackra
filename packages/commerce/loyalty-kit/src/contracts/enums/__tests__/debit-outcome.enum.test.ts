/**
 * Stackra file contract:
 * Purpose: unit tests of `DebitOutcome`: the three snake_case codes a covered debit can answer.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DebitOutcome } from "#contracts/enums/debit-outcome.enum";

describe("DebitOutcome", () => {
  it("has the written, duplicate and uncovered codes", () => {
    expect(Enum.values(DebitOutcome)).toEqual(["written", "duplicate", "uncovered"]);
    expect(DebitOutcome.Uncovered).toBe("uncovered");
  });
});
