/**
 * Stackra file contract:
 * Purpose: unit tests of `HyperpayIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { HyperpayIntegration } from "#core/providers/hyperpay/hyperpay.integration";

describe("HyperpayIntegration", () => {
  it("is declared", () => {
    expect(HyperpayIntegration.name).toBe("HyperpayIntegration");
  });

  it("sends form-encoded bodies", () => {
    expect(kindOf(HyperpayIntegration)?.options["requestBody"]).toBe("form");
  });
});
