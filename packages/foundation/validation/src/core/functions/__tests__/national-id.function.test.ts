/**
 * Stackra file contract:
 * Purpose: unit tests of `nationalId(formats)`: numbers of each kind a Market issues pass and are stored normalised;
 *          a kind the Market does not issue, a wrong check digit and an unknown country are refused, and a refusal
 *          never echoes the number.
 * Boundary: test only. The formats are test data shaped like a market pack's `identity.national_ids`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; round 3 #36; STA-1269.
 */
import { describe, expect, it } from "@stackra/testing";

import { IdentifierCheck } from "#core/enums/identifier-check.enum";
import { nationalId } from "#core/functions/national-id.function";

const formats = {
  national_id: { pattern: "^1\\d{9}$", check: IdentifierCheck.Luhn },
  birth_id: { pattern: "^[23]\\d{13}$", check: IdentifierCheck.CenturyBirthDate },
};

describe("nationalId(formats)", () => {
  it("accepts each kind and stores the normalised number", () => {
    expect(
      nationalId(formats).parse({ country: "sa", kind: "national_id", number: "101 234 5672" }),
    ).toEqual({ country: "SA", kind: "national_id", number: "1012345672" });
    expect(
      nationalId(formats).parse({ country: "EG", kind: "birth_id", number: "29001011234567" })
        .number,
    ).toBe("29001011234567");
  });

  it("refuses an unissued kind, a bad number and an unknown country", () => {
    const kind = nationalId(formats).safeParse({ country: "SA", kind: "toString", number: "1" });
    expect(kind.success).toBe(false);
    expect(kind.error?.issues[0]?.path).toEqual(["kind"]);
    const number = nationalId(formats).safeParse({
      country: "SA",
      kind: "national_id",
      number: "1012345673",
    });
    expect(number.success).toBe(false);
    expect(JSON.stringify(number.error?.issues)).not.toContain("1012345673");
    expect(
      nationalId(formats).safeParse({ country: "XX", kind: "national_id", number: "1012345672" })
        .success,
    ).toBe(false);
  });
});
