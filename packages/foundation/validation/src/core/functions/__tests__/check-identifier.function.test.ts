/**
 * Stackra file contract:
 * Purpose: unit tests of `checkIdentifier` with market-pack-style formats: a Luhn national ID, an Emirates-style ID
 *          written with hyphens, a century-and-birth-date ID, IBANs under mod 97, a pattern-only tax number and a GTIN;
 *          wrong check digits and patterns return null.
 * Boundary: test only. The formats here are test data, the way a market pack would carry them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; round 3 #36.
 */
import { describe, expect, it } from "@stackra/testing";

import { IdentifierCheck } from "#core/enums/identifier-check.enum";
import { checkIdentifier } from "#core/functions/check-identifier.function";

const nationalId = { pattern: "^[12]\\d{9}$", check: IdentifierCheck.Luhn };
const emiratesId = { pattern: "^784\\d{12}$", check: IdentifierCheck.Luhn };
const birthId = { pattern: "^[23]\\d{13}$", check: IdentifierCheck.CenturyBirthDate };
const iban = { pattern: "^[A-Z]{2}\\d{2}[0-9A-Z]{11,30}$", check: IdentifierCheck.Mod97 };

describe("checkIdentifier", () => {
  it("accepts and normalises valid identifiers", () => {
    expect(checkIdentifier("1012345672", nationalId)).toBe("1012345672");
    expect(checkIdentifier("784-1990-1234567-6", emiratesId)).toBe("784199012345676");
    expect(checkIdentifier("29001011234567", birthId)).toBe("29001011234567");
    expect(checkIdentifier("sa03 8000 0000 6080 1016 7519", iban)).toBe("SA0380000000608010167519");
    expect(checkIdentifier("GB82 WEST 1234 5698 7654 32", iban)).toBe("GB82WEST12345698765432");
    expect(checkIdentifier("١٠١٢٣٤٥٦٧٢", nationalId)).toBe("1012345672");
    expect(checkIdentifier("100123456789012", { pattern: "^100\\d{12}$" })).toBe("100123456789012");
    expect(
      checkIdentifier("4006381333931", { pattern: "^\\d{13}$", check: IdentifierCheck.Gs1 }),
    ).toBe("4006381333931");
  });

  it("refuses a wrong check digit, pattern or date", () => {
    expect(checkIdentifier("1012345673", nationalId)).toBeNull();
    expect(checkIdentifier("3012345672", nationalId)).toBeNull();
    expect(checkIdentifier("29002301234567", birthId)).toBeNull();
    expect(checkIdentifier("SA0480000000608010167519", iban)).toBeNull();
  });
});
