/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymobKsaIntegration`: the regional host is its own payments Integration.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 1); spec task T012.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { PaymobKsaIntegration } from "#core/providers/paymob/paymob-ksa.integration";

describe("PaymobKsaIntegration", () => {
  it("describes the regional host under its own provider code", () => {
    expect(kindOf(PaymobKsaIntegration)?.options).toMatchObject({
      provider: "paymob-ksa",
      baseUrl: "https://ksa.paymob.com",
    });
  });
});
