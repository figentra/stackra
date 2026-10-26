/**
 * Stackra file contract:
 * Purpose: unit tests of `checkIdentifier` with market-pack-style formats: a Luhn national ID, an Emirates-style ID
 *          written with hyphens, a century-and-birth-date ID, IBANs under mod 97, a pattern-only tax number and a GTIN;
 *          wrong check digits and patterns return null. The US pack's formats (EIN, SSN last four, ZIP and ZIP+4,
 *          state codes, NANP phone numbers) are written in their canonical forms.
 * Boundary: test only. The formats here are test data, the way a market pack would carry them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; round 3 #36; ADR 0405.
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

/** The US pack's formats, as `market-pack:us` carries them (ADR 0405). */
const us = {
  ein: {
    pattern: "^(?!00|07|08|09|17|18|19|28|29|49|69|70|78|79|89|96|97)(\\d{2})(\\d{7})$",
    canonical: "$1-$2",
  },
  ssnLastFour: { pattern: "^(?!0000)\\d{4}$" },
  zip: { pattern: "^(\\d{5})(\\d{4})?$", canonical: "$1-$2" },
  state: {
    pattern:
      "^(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY]|AS|GU|MP|PR|VI)$",
  },
  phone: { pattern: "^\\+1([2-9]\\d{2})([2-9]\\d{6})$", canonical: "+1$1$2" },
};

describe("checkIdentifier with the US pack's formats", () => {
  it("writes the canonical forms", () => {
    expect(checkIdentifier("12 3456789", us.ein)).toBe("12-3456789");
    expect(checkIdentifier("1234", us.ssnLastFour)).toBe("1234");
    expect(checkIdentifier("94105", us.zip)).toBe("94105");
    expect(checkIdentifier("94105 1234", us.zip)).toBe("94105-1234");
    expect(checkIdentifier("ca", us.state)).toBe("CA");
    expect(checkIdentifier("dc", us.state)).toBe("DC");
    expect(checkIdentifier("+1 415-555-0132", us.phone)).toBe("+14155550132");
  });

  it("refuses what the US formats exclude", () => {
    expect(checkIdentifier("07-3456789", us.ein)).toBeNull();
    expect(checkIdentifier("123456789", us.ssnLastFour)).toBeNull();
    expect(checkIdentifier("0000", us.ssnLastFour)).toBeNull();
    expect(checkIdentifier("9410", us.zip)).toBeNull();
    expect(checkIdentifier("XX", us.state)).toBeNull();
    expect(checkIdentifier("+1 115-555-0132", us.phone)).toBeNull();
    expect(checkIdentifier("+44 20 7946 0958", us.phone)).toBeNull();
  });
});
