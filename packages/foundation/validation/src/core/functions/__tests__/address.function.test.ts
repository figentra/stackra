/**
 * Stackra file contract:
 * Purpose: unit tests of `address(format)` and `countryCode()`: a complete address passes with its postal code
 *          normalised; missing required parts, too many lines, a bad postal code and an unknown country are refused.
 * Boundary: test only. The format is test data shaped like a market pack's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; OS-370; COM-117.
 */
import { describe, expect, it } from "@stackra/testing";

import { address } from "#core/functions/address.function";
import { countryCode } from "#core/functions/country-code.function";
import type { AddressFormat } from "#core/types/address-format.type";

const format: AddressFormat = {
  required: ["locality", "postalCode"],
  postalCode: { pattern: "^\\d{5}$" },
  maxLines: 2,
  layout: [["lines"], ["locality", "postalCode"], ["country"]],
};

describe("address(format)", () => {
  it("accepts a complete address", () => {
    expect(
      address(format).parse({
        lines: [" 12 King Fahd Rd "],
        locality: "Riyadh",
        postalCode: "12 345",
        district: "",
        country: "sa",
      }),
    ).toEqual({
      lines: ["12 King Fahd Rd"],
      locality: "Riyadh",
      postalCode: "12345",
      country: "SA",
    });
  });

  it("refuses missing parts, extra lines and a bad postal code", () => {
    const result = address(format).safeParse({
      lines: ["a", "b", "c"],
      postalCode: "1",
      country: "SA",
    });
    expect(result.success).toBe(false);
    expect(address(format).safeParse({ lines: ["a"], locality: "x", country: "SA" }).success).toBe(
      false,
    );
    expect(
      address(format).safeParse({ lines: ["a"], locality: "x", postalCode: "1234", country: "SA" })
        .success,
    ).toBe(false);
  });
});

describe("countryCode()", () => {
  it("upper-cases known regions and refuses the rest", () => {
    expect(countryCode().parse(" eg ")).toBe("EG");
    expect(countryCode().safeParse("XX").success).toBe(false);
    expect(countryCode().safeParse("SAU").success).toBe(false);
  });
});
