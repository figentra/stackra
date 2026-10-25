/**
 * Stackra file contract:
 * Purpose: unit tests of `IdentifierCheck` and `OneTimeCodeResult`: their codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IdentifierCheck } from "#core/enums/identifier-check.enum";
import { OneTimeCodeResult } from "#core/enums/one-time-code-result.enum";

describe("IdentifierCheck and OneTimeCodeResult", () => {
  it("have their codes", () => {
    expect(Enum.values(IdentifierCheck)).toEqual(["luhn", "mod97", "gs1", "century_birth_date"]);
    expect(Enum.values(OneTimeCodeResult)).toEqual(["valid", "invalid", "expired", "locked"]);
  });
});
