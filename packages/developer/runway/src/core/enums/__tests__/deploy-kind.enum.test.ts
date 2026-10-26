/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DeployKind`: the five destination keys of a root environment, in build order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DeployKind } from "#core/enums/deploy-kind.enum";

describe("DeployKind", () => {
  it("holds the destination keys in build order", () => {
    expect(Enum.values(DeployKind)).toEqual(["services", "web", "mobile", "desktop", "docs"]);
  });

  it("types its values", () => {
    expectTypeOf<DeployKind>().toEqualTypeOf<"services" | "web" | "mobile" | "desktop" | "docs">();
  });
});
