/**
 * Stackra file contract:
 * Purpose: unit and type tests of `FlagTargeting`: the three subjects with snake_case codes that name the keys of
 *          `FlagSubjects` (the stored `tenant` code reads the `scope` key), and the template's case name
 *          (`FlagTargeting.Visitor`).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 3); ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FlagTargeting } from "#core/enums/flag-targeting.enum";
import type { FlagSubjects } from "#core/types/flag-subjects.type";

describe("FlagTargeting", () => {
  it("holds the three subjects with snake_case codes", () => {
    expect(Enum.values(FlagTargeting)).toEqual(["visitor", "user", "tenant"]);
    expect(FlagTargeting.Visitor).toBe("visitor");
  });

  it("names exactly the keys of FlagSubjects, the stored tenant code reading the scope key", () => {
    expectTypeOf<Exclude<FlagTargeting, typeof FlagTargeting.Scope> | "scope">().toEqualTypeOf<
      keyof FlagSubjects
    >();
  });
});
