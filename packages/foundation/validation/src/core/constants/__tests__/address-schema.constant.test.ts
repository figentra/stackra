/**
 * Stackra file contract:
 * Purpose: unit tests of `ADDRESS_SCHEMA` (`Address$`): a full address parses with its parts trimmed, and an address
 *          with no line or no country is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { describe, expect, it } from "@stackra/testing";

import { ADDRESS_SCHEMA } from "#core/constants/address-schema.constant";

describe("Address$", () => {
  it("parses an address and trims its parts", () => {
    expect(
      ADDRESS_SCHEMA.parse({ lines: [" 1 King Fahd Rd "], locality: " Riyadh ", country: "SA" }),
    ).toEqual({
      lines: ["1 King Fahd Rd"],
      locality: "Riyadh",
      country: "SA",
    });
  });

  it("refuses an address with no line or no country", () => {
    expect(ADDRESS_SCHEMA.safeParse({ lines: [], country: "SA" }).success).toBe(false);
    expect(ADDRESS_SCHEMA.safeParse({ lines: ["1 King Fahd Rd"] }).success).toBe(false);
  });
});
