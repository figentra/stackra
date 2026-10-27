/**
 * Stackra file contract:
 * Purpose: unit tests of `LOYALTY_KIT_CONFIG_SCHEMA` (`LoyaltyKitConfig$`): its defaults equal `LoyaltyKitOptions`'
 *          initializers (the ledger and the named ledgers only), and it refuses an unknown named ledger.
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
    });
  });

  it("takes named ledgers of known drivers only", () => {
    expect(LOYALTY_KIT_CONFIG_SCHEMA.parse({ ledgers: { primary: "memory" } }).ledgers).toEqual({
      primary: "memory",
    });
    expect(() => LOYALTY_KIT_CONFIG_SCHEMA.parse({ ledgers: { primary: "redis" } })).toThrow();
  });

  it("carries no business value: rates and caps are settings", () => {
    expect(Object.keys(LOYALTY_KIT_CONFIG_SCHEMA.shape).sort()).toEqual(["ledger", "ledgers"]);
  });
});
