/**
 * Stackra file contract:
 * Purpose: unit tests of `ADDRESS_FORMAT_SCHEMA` (`AddressFormat$`): the US pack's `identity.address_format` value
 *          parses and feeds `address(format)`, which checks and stores the state code and ZIP+4; an unknown part and
 *          a broken nested pattern are refused.
 * Boundary: test only; pure. The US value is copied from the pack as a fixture (ADR 0405 rule 3).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0405; ADR 0417; OS tenancy G8 (STA-1269).
 */
import { describe, expect, it } from "@stackra/testing";

import { ADDRESS_FORMAT_SCHEMA } from "#core/constants/address-format-schema.constant";
import { address } from "#core/functions/address.function";

/** The `us` pack's `identity.address_format` value. */
const usValue: unknown = {
  required: ["locality", "region", "postalCode"],
  postalCode: { pattern: "^(\\d{5})(\\d{4})?$", canonical: "$1-$2" },
  region: { pattern: "^(CA|NY|TX|DC)$" },
  maxLines: 2,
  layout: [["lines"], ["locality", "region", "postalCode"], ["country"]],
};

describe("AddressFormat$", () => {
  it("parses the pack value and wires it to address(format)", () => {
    const shipping = address(ADDRESS_FORMAT_SCHEMA.parse(usValue));
    expect(
      shipping.parse({
        lines: ["1 Market St"],
        locality: "San Francisco",
        region: "ca",
        postalCode: "941051234",
        country: "US",
      }),
    ).toEqual({
      lines: ["1 Market St"],
      locality: "San Francisco",
      region: "CA",
      postalCode: "94105-1234",
      country: "US",
    });
    expect(
      shipping.safeParse({
        lines: ["1 Market St"],
        locality: "San Francisco",
        region: "ZZ",
        postalCode: "94105",
        country: "US",
      }).success,
    ).toBe(false);
  });

  it("refuses an unknown part and a broken pattern", () => {
    expect(
      ADDRESS_FORMAT_SCHEMA.safeParse({ required: ["street"], layout: [["lines"]] }).success,
    ).toBe(false);
    expect(
      ADDRESS_FORMAT_SCHEMA.safeParse({
        required: [],
        postalCode: { pattern: "(" },
        layout: [["lines"]],
      }).success,
    ).toBe(false);
  });
});
