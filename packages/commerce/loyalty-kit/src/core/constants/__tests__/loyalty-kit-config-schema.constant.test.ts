/**
 * Stackra file contract:
 * Purpose: unit tests of `LOYALTY_KIT_CONFIG_SCHEMA` (`LoyaltyKitConfig$`): its defaults equal `LoyaltyKitOptions`'
 *          initializers, and it refuses a zero point value, a non-positive earn rate and an unknown named ledger.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { LOYALTY_KIT_CONFIG_SCHEMA } from "#core/constants/loyalty-kit-config-schema.constant";

describe("LOYALTY_KIT_CONFIG_SCHEMA", () => {
  it("fills every default", () => {
    expect(LOYALTY_KIT_CONFIG_SCHEMA.parse({})).toEqual({
      ledger: "postgres",
      ledgers: {},
      pointValueMinor: 1,
      earnPerMinor: 0.01,
      maxRedeemPercent: 50,
    });
  });

  it("takes named ledgers of known drivers only", () => {
    expect(LOYALTY_KIT_CONFIG_SCHEMA.parse({ ledgers: { primary: "memory" } }).ledgers).toEqual({
      primary: "memory",
    });
    expect(() => LOYALTY_KIT_CONFIG_SCHEMA.parse({ ledgers: { primary: "redis" } })).toThrow();
  });

  it("refuses a zero point value and a non-positive earn rate", () => {
    expect(() => LOYALTY_KIT_CONFIG_SCHEMA.parse({ pointValueMinor: 0 })).toThrow();
    expect(() => LOYALTY_KIT_CONFIG_SCHEMA.parse({ earnPerMinor: 0 })).toThrow();
  });
});
