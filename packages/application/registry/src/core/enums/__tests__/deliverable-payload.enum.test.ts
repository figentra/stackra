/**
 * Stackra file contract:
 * Purpose: unit tests of `DeliverablePayload`: thin and full.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224; OS-212.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeliverablePayload } from "#core/enums/deliverable-payload.enum";

describe("DeliverablePayload", () => {
  it("has thin and full", () => {
    expect(Enum.values(DeliverablePayload)).toEqual(["thin", "full"]);
  });
});
