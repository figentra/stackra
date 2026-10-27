/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentCapability`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";

describe("PaymentCapability", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(PaymentCapability)).toEqual([
      "checkout",
      "capture",
      "tokens",
      "payouts",
      "platform",
      "disputes",
      "terminal",
      "terminal_tips",
      "methods",
      "restricted_tender",
      "terminal_pin",
      "soft_pos",
      "pre_auth",
      "incremental_auth",
    ]);
  });
});
