/**
 * Stackra file contract:
 * Purpose: unit tests of `AssuranceLevel`: the three NIST levels, weakest first, the one set actions and identity
 *          share.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0207 (decision 1); STA-1383.
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { AssuranceLevel } from "#core/enums/assurance-level.enum";

describe("AssuranceLevel", () => {
  it("holds the levels weakest first", () => {
    expect(Enum.values(AssuranceLevel)).toEqual(["aal1", "aal2", "aal3"]);
  });

  it("has a type that refuses other strings", () => {
    const level: AssuranceLevel = AssuranceLevel.Aal2;
    // @ts-expect-error -- not a level
    const other: AssuranceLevel = "aal4";
    expect([level, other]).toEqual(["aal2", "aal4"]);
  });
});
