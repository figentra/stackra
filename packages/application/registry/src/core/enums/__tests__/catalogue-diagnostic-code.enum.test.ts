/**
 * Stackra file contract:
 * Purpose: unit tests of `CatalogueDiagnosticCode`: the seven snake_case codes in source order and the type of the
 *          same name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CatalogueDiagnosticCode } from "#core/enums/catalogue-diagnostic-code.enum";

describe("CatalogueDiagnosticCode", () => {
  it("lists the codes in source order", () => {
    expect(Enum.values(CatalogueDiagnosticCode)).toEqual([
      "manifest_invalid",
      "duplicate_member",
      "identity_collision",
      "unknown_module",
      "foreign_namespace",
      "unknown_dependency",
      "dependency_cycle",
    ]);
  });

  it("names each case by its code", () => {
    expect(CatalogueDiagnosticCode.IdentityCollision).toBe("identity_collision");
    expect(Enum.meta(CatalogueDiagnosticCode, CatalogueDiagnosticCode.DependencyCycle)).toEqual({});
  });

  it("types a value as one of the codes", () => {
    expectTypeOf<CatalogueDiagnosticCode>().toEqualTypeOf<
      | "manifest_invalid"
      | "duplicate_member"
      | "identity_collision"
      | "unknown_module"
      | "foreign_namespace"
      | "unknown_dependency"
      | "dependency_cycle"
    >();
  });
});
