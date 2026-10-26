/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymobUaeIntegration`: the regional host is its own payments Integration.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 1); spec task T012.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { PaymobUaeIntegration } from "#core/providers/paymob/paymob-uae.integration";

describe("PaymobUaeIntegration", () => {
  it("describes the regional host under its own provider code", () => {
    expect(kindOf(PaymobUaeIntegration)?.options).toMatchObject({
      provider: "paymob-uae",
      baseUrl: "https://uae.paymob.com",
    });
  });
});
