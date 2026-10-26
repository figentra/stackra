/**
 * Stackra file contract:
 * Purpose: unit tests of `address(format)` and `countryCode()`: a complete address passes with its postal code
 *          normalised; missing required parts, too many lines, a bad postal code and an unknown country are refused.
 *          The Italian CAP and the Dutch `1234 AB` postcode validate as their packs carry them, stored canonical.
 * Boundary: test only. The format is test data shaped like a market pack's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; OS-370; COM-117; ADR 0403.
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

/** The Italian pack's address format: a five-digit CAP and the province code. */
const italy: AddressFormat = {
  required: ["locality", "postalCode", "region"],
  postalCode: { pattern: "^\\d{5}$" },
  layout: [["lines"], ["postalCode", "locality", "region"], ["country"]],
};

/** The Dutch pack's address format: `1234 AB`, never starting with 0 and never SA, SD or SS. */
const netherlands: AddressFormat = {
  required: ["locality", "postalCode"],
  postalCode: { pattern: "^([1-9]\\d{3})(?!SA|SD|SS)([A-Z]{2})$", canonical: "$1 $2" },
  layout: [["lines"], ["postalCode", "locality"], ["country"]],
};

/** True when an Amsterdam address with `postalCode` passes the Dutch format. */
const dutch = (postalCode: string) =>
  address(netherlands).safeParse({
    lines: ["Damrak 1"],
    locality: "Amsterdam",
    postalCode,
    country: "NL",
  }).success;

describe("address(format) with the Italian and Dutch formats", () => {
  it("accepts an Italian CAP and a Dutch postcode, stored canonical", () => {
    expect(
      address(italy).parse({
        lines: ["Via Roma 1"],
        locality: "Milano",
        region: "MI",
        postalCode: "20121",
        country: "it",
      }).postalCode,
    ).toBe("20121");
    expect(
      address(netherlands).parse({
        lines: ["Damrak 1"],
        locality: "Amsterdam",
        postalCode: "1012lg",
        country: "NL",
      }).postalCode,
    ).toBe("1012 LG");
  });

  it("refuses a malformed CAP or postcode", () => {
    expect(dutch("0123 AB")).toBe(false);
    expect(dutch("1012 SS")).toBe(false);
    expect(dutch("1012")).toBe(false);
    expect(
      address(italy).safeParse({
        lines: ["Via Roma 1"],
        locality: "Milano",
        region: "MI",
        postalCode: "2012",
        country: "IT",
      }).success,
    ).toBe(false);
  });
});
