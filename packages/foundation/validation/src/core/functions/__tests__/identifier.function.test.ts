/**
 * Stackra file contract:
 * Purpose: unit tests of `identifier`, the schema of an identifier field for a Market's `IdentifierFormat`: a valid
 *          value parses to its normalised form (hyphens and spaces dropped, Arabic-Indic digits read as digits, an IBAN
 *          upper-cased); a value that fails the pattern or the check digit is refused with one custom message that never
 *          shows the format; a value that is not a string is refused as a string; each schema keeps its own format.
 * Boundary: test only. The formats here are test data, the way a market pack would carry them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; round 3 #36.
 */
import { describe, expect, it } from "@stackra/testing";

import { IdentifierCheck } from "#core/enums/identifier-check.enum";
import { identifier } from "#core/functions/identifier.function";

const emiratesId = { pattern: "^784\\d{12}$", check: IdentifierCheck.Luhn };
const iban = { pattern: "^[A-Z]{2}\\d{2}[0-9A-Z]{11,30}$", check: IdentifierCheck.Mod97 };
const REFUSAL = "Expected a valid identifier for this market";

describe(identifier, () => {
  it("parses a valid value to its normalised form", () => {
    expect(identifier(emiratesId).parse("784-1990-1234567-6")).toBe("784199012345676");
    expect(identifier(emiratesId).parse(" 784 1990 1234567 6 ")).toBe("784199012345676");
    expect(identifier(iban).parse("sa03 8000 0000 6080 1016 7519")).toBe(
      "SA0380000000608010167519",
    );
  });

  it("reads Arabic-Indic digits as digits", () => {
    expect(identifier(emiratesId).parse("٧٨٤١٩٩٠١٢٣٤٥٦٧٦")).toBe("784199012345676");
  });

  it("refuses a wrong check digit and a wrong pattern with one custom message", () => {
    for (const value of ["784-1990-1234567-1", "123-1990-1234567-6", "", "not an id"]) {
      const result = identifier(emiratesId).safeParse(value);
      expect(result.success, value).toBe(false);
      expect(result.error?.issues).toHaveLength(1);
      expect(result.error?.issues[0]).toMatchObject({ code: "custom", message: REFUSAL });
    }
  });

  it("never shows the format in the refusal", () => {
    const result = identifier(emiratesId).safeParse("784-1990-1234567-1");
    expect(JSON.stringify(result.error?.issues)).not.toContain(emiratesId.pattern);
    expect(JSON.stringify(result.error?.issues)).not.toContain("Luhn");
  });

  it("refuses a value that is not a string as a string", () => {
    const result = identifier(emiratesId).safeParse(784_199_012_345_676);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ code: "invalid_type", expected: "string" });
  });

  it("keeps its own format: the schemas of two formats do not share one", () => {
    const asEmirates = identifier(emiratesId);
    const asIban = identifier(iban);
    expect(asEmirates.safeParse("SA0380000000608010167519").success).toBe(false);
    expect(asIban.safeParse("784199012345676").success).toBe(false);
    expect(asEmirates.safeParse("784199012345676").success).toBe(true);
    expect(asIban.safeParse("SA0380000000608010167519").success).toBe(true);
  });
});
