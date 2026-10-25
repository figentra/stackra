/**
 * Stackra file contract:
 * Purpose: unit tests of `EarnVisitOutput`: it holds the stamps credited and the card they leave.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { EarnVisitOutput } from "#node/schemas/earn-visit-output.schema";

describe("EarnVisitOutput", () => {
  it("holds the stamps and the card", () => {
    const card = { stamps: 1, onCard: 4, perCard: 10, fullCards: 0 };
    expect({ ...EarnVisitOutput.create(card) }).toEqual(card);
  });
});
