/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayEnvironment`: the four environments in promotion order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

describe("RunwayEnvironment", () => {
  it("lists dev, preview, staging and production", () => {
    expect(Enum.values(RunwayEnvironment)).toEqual(["dev", "preview", "staging", "production"]);
    expect(RunwayEnvironment.Production).toBe("production");
    expectTypeOf<RunwayEnvironment>().toEqualTypeOf<"dev" | "preview" | "staging" | "production">();
  });
});
