/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SignatureStatus`: an `Enum.of` enum whose codes are in source order, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum); ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SignatureStatus } from "#contracts/enums/signature-status.enum";

describe("SignatureStatus", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(SignatureStatus)).toEqual([
      "sent",
      "viewed",
      "signed",
      "declined",
      "expired",
      "cancelled",
    ]);
  });

  it("types its values", () => {
    expectTypeOf<SignatureStatus>().toEqualTypeOf<
      "sent" | "viewed" | "signed" | "declined" | "expired" | "cancelled"
    >();
  });
});
