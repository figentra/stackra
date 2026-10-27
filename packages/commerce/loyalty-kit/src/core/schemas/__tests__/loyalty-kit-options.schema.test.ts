/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyKitOptions`: a registered shape whose initializers are the package defaults, built
 *          with `create`. Rates are settings, not options (STA-1323).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26); ADR 0328; ADR 0454.
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { LoyaltyKitOptions } from "#core/schemas/loyalty-kit-options.schema";

describe("LoyaltyKitOptions", () => {
  it("is a shape whose initializers are the defaults", () => {
    const options = new LoyaltyKitOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual({
      ledger: "postgres",
      ledgers: {},
    });
  });

  it("builds through its registered schema", () => {
    const options = LoyaltyKitOptions.create({
      ledger: "memory",
      ledgers: { legacy: "postgres" },
    });
    expect(options.ledger).toBe("memory");
    expect(options.ledgers).toEqual({ legacy: "postgres" });
  });
});
