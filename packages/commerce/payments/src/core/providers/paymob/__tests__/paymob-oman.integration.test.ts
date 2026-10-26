/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymobOmanIntegration`: the regional host is its own payments Integration.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 1); spec task T012.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { PaymobOmanIntegration } from "#core/providers/paymob/paymob-oman.integration";

describe("PaymobOmanIntegration", () => {
  it("describes the regional host under its own provider code", () => {
    expect(kindOf(PaymobOmanIntegration)?.options).toMatchObject({
      provider: "paymob-oman",
      baseUrl: "https://oman.paymob.com",
    });
  });
});
