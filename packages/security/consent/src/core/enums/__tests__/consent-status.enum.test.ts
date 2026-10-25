/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentStatus`: granted, denied and undecided, in that order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0298.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ConsentStatus } from "#core/enums/consent-status.enum";

describe("ConsentStatus", () => {
  it("lists the statuses in order", () => {
    expect(Enum.values(ConsentStatus)).toEqual(["granted", "denied", "undecided"]);
    expectTypeOf<ConsentStatus>().toEqualTypeOf<"granted" | "denied" | "undecided">();
  });
});
