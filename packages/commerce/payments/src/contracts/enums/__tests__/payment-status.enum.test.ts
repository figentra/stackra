/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentStatus`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";

describe("PaymentStatus", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(PaymentStatus)).toEqual([
      "pending",
      "authorized",
      "captured",
      "partially_refunded",
      "refunded",
      "voided",
      "failed",
      "unknown",
    ]);
  });
});
